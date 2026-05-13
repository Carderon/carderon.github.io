import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ClockEngine } from '@/engines/tick/ClockEngine'
import { createEventsSystem } from '@/engines/tick/systems/eventsSystem'
import { createGaugesSystem } from '@/engines/tick/systems/gaugesSystem'
import { createResourcesSystem } from '@/engines/tick/systems/resourcesSystem'

import type { TickContext } from '@/types/TickType'

import { useActivityStore } from '@/stores/activityStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useEventStore } from '@/stores/eventStore'
import { useGameStateStore } from '@/stores/gameStateStore'
import { useGaugeStore } from '@/stores/gaugeStore'
import { useImprovementStore } from '@/stores/improvementStore'
import { useLogStore } from '@/stores/logStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useWorldStore } from '@/stores/worldStore'

/**
 * Horloge de simulation : instancie le `ClockEngine`, enregistre les systèmes
 * de tick et expose l’état (`elapsed`, `tick`, pause, vitesse) au reste de l’app.
 *
 * Toute progression liée au temps de jeu (production, événements, cooldowns,
 * constructions, réparations de tuiles) doit passer par ce moteur pour rester
 * cohérente avec pause et multiplicateur de vitesse.
 */
export const useClockStore = defineStore('clock', () => {
  // ---------------------------------------------------------------------------
  // État réactif (consommé par les vues et par les stores synchronisés sur le tick)
  // ---------------------------------------------------------------------------
  const elapsed = ref(0)
  const tick = ref(0)
  const isRunning = ref(false)
  const isPaused = ref(false)

  // ---------------------------------------------------------------------------
  // Moteur (une seule instance pour toute l’application)
  // ---------------------------------------------------------------------------
  const engine = new ClockEngine({
    maxDeltaTime: { isEnabled: true, maxSeconds: 0.25 }, // évite les sauts énormes si l’onglet est en arrière-plan
  })

  // ---------------------------------------------------------------------------
  // Stores injectés dans les systèmes (résolus une fois à l’init du store clock)
  // ---------------------------------------------------------------------------
  const characterStore = useCharacterStore()
  const logStore = useLogStore()
  const resourceStore = useResourceStore()
  const gaugeStore = useGaugeStore()
  const gameStateStore = useGameStateStore()
  const eventStore = useEventStore()
  const activityStore = useActivityStore()
  const improvementStore = useImprovementStore()
  const worldStore = useWorldStore()

  // ---------------------------------------------------------------------------
  // Systèmes enregistrés sur le moteur
  //
  // Règle : l’ordre d’enregistrement est l’ordre d’appel de `onTick` à chaque frame.
  // 1) Publier le temps sim et les compteurs UI — avant le gameplay qui peut les lire.
  // 2) Événements, ressources, jauges — logique continue du tick.
  // ---------------------------------------------------------------------------

  const publishClockState = {
    id: 'clock.publish',
    onTick: (ctx: TickContext) => {
      elapsed.value = ctx.elapsed
      tick.value = ctx.tick
      improvementStore.applyGameTime(ctx.elapsed)
      activityStore.applyGameTime(ctx.elapsed)
      worldStore.applyGameTime(ctx.elapsed)
    },
  }

  const eventsSystem = createEventsSystem({
    getEra: () => characterStore.getActiveCharacter()?.era ?? 0,
    addLog: (message) => logStore.addLog(message),
    getFlag: (flag) => gameStateStore.getFlag(flag),
    setFlag: (flag, value) => gameStateStore.setFlag(flag, value),
    getCounter: (counter) => gameStateStore.getCounter(counter),
    incrementCounter: (counter, by) => gameStateStore.incrementCounter(counter, by),
    addResource: (slug, amount) => resourceStore.addResource(slug, amount),
    spendResource: (costs) => resourceStore.spendResource(costs),
    canAfford: (costs) => resourceStore.canAfford(costs),
    getGaugeQuantity: (slug) => gaugeStore.getGaugeQuantity(slug),
    spendGauge: (slug, qty) => gaugeStore.trySpendGauge(slug, qty),
    addGauge: (slug, amt) => gaugeStore.addGauge(slug, amt),
    enqueueEvent: (event) => eventStore.enqueueEvent(event),
  })

  const resourcesSystem = createResourcesSystem({
    produceResources: (dt) => resourceStore.produceResources(dt),
    recomputeVisibility: () => resourceStore.recomputeVisibility(),
  })

  const gaugesSystem = createGaugesSystem({
    regenGauges: (dt) => gaugeStore.regenGauges(dt),
  })

  engine.register(publishClockState)
  engine.register(eventsSystem)
  engine.register(resourcesSystem)
  engine.register(gaugesSystem)

  // ---------------------------------------------------------------------------
  // Actions : pilotage du moteur + resets d’état transitoire liés au temps sim
  // ---------------------------------------------------------------------------

  function clearScheduledSimActions(): void {
    activityStore.resetCooldowns()
    improvementStore.clearPendingBuilds()
    worldStore.cancelPendingRepairsAndRefund()
  }

  function zeroSimTimeInStores(): void {
    activityStore.applyGameTime(0)
    improvementStore.applyGameTime(0)
    worldStore.applyGameTime(0)
  }

  function start(): void {
    if (isRunning.value) return
    gameStateStore.reset()
    eventStore.clear()
    clearScheduledSimActions()
    engine.start()
    isRunning.value = true
    isPaused.value = false
  }

  function stop(): void {
    if (!isRunning.value) return
    engine.stop()
    isRunning.value = false
    isPaused.value = false
    elapsed.value = 0
    tick.value = 0
    clearScheduledSimActions()
    zeroSimTimeInStores()
  }

  function pause(): void {
    if (!isRunning.value || isPaused.value) return
    engine.pause()
    isPaused.value = true
  }

  function resume(): void {
    if (!isRunning.value || !isPaused.value) return
    engine.resume()
    isPaused.value = false
  }

  function setSpeed(speed: number): void {
    engine.setSpeed(speed)
  }

  return {
    elapsed,
    tick,
    isRunning,
    isPaused,
    start,
    stop,
    pause,
    resume,
    setSpeed,
  }
})
