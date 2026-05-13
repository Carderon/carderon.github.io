<template>
  <div>
    <div class="mb-4 flex items-baseline justify-between gap-4">
      <h3 class="text-2xl font-bold text-black dark:text-white">{{ room?.name ?? 'Pièce' }}</h3>
      <span class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {{ repairedCount }}/{{ totalCount }} ({{ percentRepaired }}%)
      </span>
    </div>
    <div v-if="imagesLoaded"
      class="relative z-0 mx-auto grid w-[500px] grid-cols-3 gap-0 border border-gray-400 dark:border-gray-600">
      <template v-for="(row, y) in tiles" :key="y">
        <div v-for="(tile, x) in row" :key="`${x}-${y}`"
          class="group relative z-0 aspect-square cursor-default overflow-visible border border-gray-400 dark:border-gray-600 hover:z-[120]"
          :class="tileWrapperClass(tile)" @click="handleTileClick(tile.id)">
          <!-- Calque visuel seul : le filtre hover ne s’applique pas au tooltip (évite les bugs d’empilement). -->
          <div class="absolute inset-0 overflow-hidden" :class="tileVisualHoverClass(tile)">
            <!-- État cassé (pas de chantier en cours) -->
            <template v-if="tile.state !== 'ready' && !isRepairing(tile.id)">
              <div class="absolute inset-0 bg-cover bg-center"
                :style="{ backgroundImage: `url(${tile.backgrounds.broken})` }" />
              <span
                class="relative z-[2] flex h-full items-center justify-center text-lg text-black dark:text-white drop-shadow">
                ✗
              </span>
            </template>

            <!-- Réparation : couleur en dessous, calque gris qui remonte (révélation) -->
            <template v-else-if="isRepairing(tile.id)">
              <div class="absolute inset-0 overflow-hidden">
                <div class="absolute inset-0 bg-cover bg-center"
                  :style="{ backgroundImage: `url(${tile.backgrounds.ready})` }" />
                <div class="absolute inset-0 bg-cover bg-center will-change-transform grayscale"
                  :style="repairRevealStyle(tile)" />
              </div>
              <span
                class="relative z-[2] flex h-full items-center justify-center text-[10px] font-medium tabular-nums text-black dark:text-white drop-shadow">
                {{ Math.round(repairProgressPct(tile.id)) }}%
              </span>
            </template>

            <!-- Réparé -->
            <template v-else>
              <div class="absolute inset-0 bg-cover bg-center"
                :style="{ backgroundImage: `url(${tile.backgrounds.ready})` }" />
              <span
                class="relative z-[2] flex h-full items-center justify-center text-lg text-black dark:text-white drop-shadow">
                ✓
              </span>
            </template>
          </div>

          <GameTooltip placement="above">
            <p class="text-sm font-semibold text-black dark:text-white">{{ tile.displayName ?? tile.id }}</p>
            <template v-if="tile.state !== 'ready'">
              <p v-if="hasCost(tile)" class="mt-1 text-[11px]">
                Coût :
                <span :class="canAffordTile(tile) ? 'text-amber-200' : 'text-red-300'">
                  {{ formatCost(tile) }}
                </span>
              </p>
              <p v-else class="mt-1 text-[11px]">Coût : gratuit</p>
              <p class="mt-1 text-[11px] text-gray-300">Durée : {{ tileDurSeconds(tile) }}s</p>
              <p v-if="isRepairing(tile.id)" class="mt-1 text-[11px] text-emerald-300">
                Réparation en cours…
              </p>
            </template>
            <p v-else class="mt-1 text-[11px] text-emerald-300">Réparé</p>
          </GameTooltip>
        </div>
      </template>
    </div>
    <div v-else class="text-sm text-gray-500">Chargement …</div>
  </div>
</template>

<script setup lang="ts">
import GameTooltip from '@/components/ui/GameTooltip.vue'
import type { Tile } from '@/types/WorldType'
import { useClockStore } from '@/stores/clockStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useWorldStore } from '@/stores/worldStore'
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'GameBedroom' })

const props = defineProps<{
  buildingId: string
  roomId: string
}>()

const worldStore = useWorldStore()
const resourceStore = useResourceStore()
const clockStore = useClockStore()
const { tick } = storeToRefs(clockStore)

const room = computed(() => worldStore.getRoom(props.buildingId, props.roomId))
const tiles = computed(() => room.value?.tiles || [])

const allTiles = computed(() => tiles.value.flat())
const totalCount = computed(() => allTiles.value.length)
const repairedCount = computed(() => allTiles.value.filter((t) => t.state === 'ready').length)
const percentRepaired = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((repairedCount.value / totalCount.value) * 100)
})

function isRepairing(tileId: string): boolean {
  void tick.value
  return worldStore.isTileRepairing(tileId)
}

function repairProgressPct(tileId: string): number {
  void tick.value
  return worldStore.getTileRepairProgress01(tileId) * 100
}

/** Calque gris identique à l’image « ready », remonté pour révéler la couleur en dessous. */
function repairRevealStyle(tile: Tile) {
  void tick.value
  const p = worldStore.getTileRepairProgress01(tile.id)
  return {
    backgroundImage: `url(${tile.backgrounds.ready})`,
    transform: `translateY(-${p * 100}%)`,
  }
}

function tileDurSeconds(tile: Tile): number {
  return tile.repairDurationSeconds != null && tile.repairDurationSeconds > 0 ? tile.repairDurationSeconds : 6
}

function hasCost(tile: Tile): boolean {
  if (!tile.repairCost) return false
  return tile.repairCost.some(({ quantity }) => quantity > 0)
}

function formatCost(tile: Tile): string {
  if (!tile.repairCost) return ''
  return tile.repairCost
    .filter(({ quantity }) => quantity > 0)
    .map(
      ({ resourceSlug, quantity }) =>
        `${quantity} ${resourceStore.getResource(resourceSlug)?.name ?? resourceSlug}`,
    )
    .join(', ')
}

function canAffordTile(tile: Tile): boolean {
  if (!tile.repairCost || !hasCost(tile)) return true
  return resourceStore.canAfford(tile.repairCost)
}

/** Curseur / opacité sur la cellule entière (pas de hover:brightness ici). */
function tileWrapperClass(tile: Tile) {
  void tick.value
  if (tile.state === 'ready' && !isRepairing(tile.id)) return ''
  if (isRepairing(tile.id)) return 'cursor-wait'
  if (worldStore.canRepairTile(props.buildingId, props.roomId, tile.id)) {
    return 'cursor-pointer'
  }
  return 'cursor-not-allowed'
}

/** Luminosité au survol uniquement sur le visuel, pour ne pas créer un contexte d’empilement qui masque le tooltip. */
function tileVisualHoverClass(tile: Tile) {
  if (tile.state === 'ready' && !isRepairing(tile.id)) return ''
  if (isRepairing(tile.id)) return ''
  if (worldStore.canRepairTile(props.buildingId, props.roomId, tile.id)) {
    return 'transition-[filter] duration-100 hover:brightness-110'
  }
  return ''
}

function handleTileClick(tileId: string) {
  if (!worldStore.canRepairTile(props.buildingId, props.roomId, tileId)) return
  worldStore.startRepairTile(props.buildingId, props.roomId, tileId)
}

const imagesLoaded = ref(false)

onMounted(() => {
  const sources = tiles.value.flatMap((row) =>
    row.flatMap((tile) => [tile.backgrounds.broken, tile.backgrounds.ready]),
  )

  if (!sources.length) {
    imagesLoaded.value = true
    return
  }

  const preload = sources.map(
    (src) =>
      new Promise<void>((resolve) => {
        const image = new Image()
        image.onload = () => resolve()
        image.onerror = () => resolve()
        image.src = src
      }),
  )

  Promise.all(preload).then(() => {
    imagesLoaded.value = true
  })
})
</script>
