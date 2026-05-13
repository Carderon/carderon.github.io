import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Building, Tile, TileCost } from '@/types/WorldType'
import { createHouse } from '@/data/buildings/age1/house'
import { useGameStateStore } from '@/stores/gameStateStore'
import { useLogStore } from '@/stores/logStore'
import { useResourceStore } from '@/stores/resourceStore'

const DEFAULT_REPAIR_DURATION_SECONDS = 6

type PendingRepair = {
  completeAt: number
  /** Pour rembourser si la partie est arrêtée pendant la construction. */
  refundCosts: TileCost
}

/**
 * Runtime state of the game world (buildings, rooms, tiles).
 *
 * Réparation d’une tuile : paiement au début + durée en **temps sim** ;
 * à la fin : état `ready` + compteur tuiles réparées.
 */
export const useWorldStore = defineStore('world', () => {
  const buildings = ref<Building[]>([createHouse()])

  /** Temps sim aligné sur `ClockEngine.elapsed` */
  const gameTimeSim = ref(0)
  /** Tuile en cours de réparation → instant sim de fin + coût à rembourser si annulation */
  const pendingRepairs = ref<Record<string, PendingRepair>>({})

  const getBuilding = (id: string) => buildings.value.find((b) => b.id === id)

  const getRoom = (buildingId: string, roomId: string) => {
    const building = buildings.value.find((b) => b.id === buildingId)
    return building?.rooms.find((r) => r.id === roomId)
  }

  const findTile = (buildingId: string, roomId: string, tileId: string) => {
    const room = getRoom(buildingId, roomId)
    return room?.tiles.flat().find((t) => t.id === tileId)
  }

  function findTileContext(
    tileId: string,
  ): { buildingId: string; roomId: string; tile: Tile } | null {
    for (const b of buildings.value) {
      for (const r of b.rooms) {
        for (const row of r.tiles) {
          for (const t of row) {
            if (t.id === tileId) return { buildingId: b.id, roomId: r.id, tile: t }
          }
        }
      }
    }
    return null
  }

  const hasRepairCost = (tile: Tile): boolean => {
    if (!tile.repairCost) return false
    return tile.repairCost.some(({ quantity }) => quantity > 0)
  }

  function refundCosts(costs: TileCost) {
    const resourceStore = useResourceStore()
    for (const { resourceSlug, quantity } of costs) {
      if (quantity > 0) resourceStore.addResource(resourceSlug, quantity)
    }
  }

  /**
   * À chaque tick du clock : termine les réparations dues.
   */
  function applyGameTime(simElapsedSeconds: number) {
    gameTimeSim.value = simElapsedSeconds

    for (const tileId of Object.keys(pendingRepairs.value)) {
      if (simElapsedSeconds >= pendingRepairs.value[tileId].completeAt) {
        completeRepair(tileId)
      }
    }
  }

  function completeRepair(tileId: string) {
    const ctx = findTileContext(tileId)
    const next = { ...pendingRepairs.value }
    delete next[tileId]
    pendingRepairs.value = next

    if (!ctx || ctx.tile.state === 'ready') return

    ctx.tile.state = 'ready'
    useGameStateStore().incrementCounter('age1.counter.tilesRepaired')
  }

  /** Annule les chantiers en cours et rembourse (stop partie / nouvelle run). */
  function cancelPendingRepairsAndRefund() {
    for (const tileId of Object.keys(pendingRepairs.value)) {
      refundCosts(pendingRepairs.value[tileId].refundCosts)
    }
    pendingRepairs.value = {}
  }

  const isTileRepairing = (tileId: string): boolean => pendingRepairs.value[tileId] != null

  function getTileRepairProgress01(tileId: string): number {
    const pending = pendingRepairs.value[tileId]
    const ctx = findTileContext(tileId)
    if (!pending || !ctx) return 0

    const duration =
      ctx.tile.repairDurationSeconds != null && ctx.tile.repairDurationSeconds > 0
        ? ctx.tile.repairDurationSeconds
        : DEFAULT_REPAIR_DURATION_SECONDS

    const start = pending.completeAt - duration
    const t = gameTimeSim.value
    return Math.min(1, Math.max(0, (t - start) / duration))
  }

  const canRepairTile = (buildingId: string, roomId: string, tileId: string): boolean => {
    if (isTileRepairing(tileId)) return false
    const tile = findTile(buildingId, roomId, tileId)
    if (!tile || tile.state === 'ready') return false
    if (!tile.repairCost || !hasRepairCost(tile)) return true
    const resourceStore = useResourceStore()
    return resourceStore.canAfford(tile.repairCost)
  }

  /**
   * Lance la réparation : paie tout de suite, barre de progression jusqu’à `completeAt` (temps sim).
   */
  function startRepairTile(buildingId: string, roomId: string, tileId: string): boolean {
    if (!canRepairTile(buildingId, roomId, tileId)) return false

    const tile = findTile(buildingId, roomId, tileId)
    if (!tile || tile.state === 'ready') return false

    const duration =
      tile.repairDurationSeconds != null && tile.repairDurationSeconds > 0
        ? tile.repairDurationSeconds
        : DEFAULT_REPAIR_DURATION_SECONDS

    let paidCosts: TileCost = []
    if (tile.repairCost && hasRepairCost(tile)) {
      const resourceStore = useResourceStore()
      if (!resourceStore.spendResource(tile.repairCost)) {
        useLogStore().addLog('Pas assez de ressources pour réparer.')
        return false
      }
      paidCosts = tile.repairCost.map((c) => ({ ...c }))
    }

    pendingRepairs.value = {
      ...pendingRepairs.value,
      [tileId]: {
        completeAt: gameTimeSim.value + duration,
        refundCosts: paidCosts,
      },
    }
    return true
  }

  return {
    buildings,
    gameTimeSim,
    pendingRepairs,
    getBuilding,
    getRoom,
    findTile,
    findTileContext,
    canRepairTile,
    startRepairTile,
    applyGameTime,
    cancelPendingRepairsAndRefund,
    isTileRepairing,
    getTileRepairProgress01,
  }
})
