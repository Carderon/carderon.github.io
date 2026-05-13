import { defineStore } from 'pinia'
import { ref } from 'vue'
import { activitiesData } from '@/data/activities'
import type { ActivityType } from '@/types/ActivityType'
import { useCharacterStore } from '@/stores/characterStore'
import { useGameStateStore } from '@/stores/gameStateStore'
import { useGaugeStore } from '@/stores/gaugeStore'
import { useImprovementStore } from '@/stores/improvementStore'
import { useLogStore } from '@/stores/logStore'
import { useResourceStore } from '@/stores/resourceStore'
import {
  applyActivityEffects,
  canAffordActivity,
  meetsConditions,
  spendActivityCosts,
  type ActivityEngineDeps,
} from '@/engines/activities/activityEngine'

export const useActivityStore = defineStore('activities', () => {
  const activities = ref<ActivityType[]>(activitiesData.map((a) => ({ ...a })))
  /**
   * Temps de simulation (s) — synchronisé par `clockStore` depuis le `ClockEngine`.
   * Les cooldowns sont exprimés dans ce référentiel (pause / vitesse ×2 inclus).
   */
  const gameTimeSim = ref(0)
  /** Fin de cooldown en temps sim (s) : actif tant que `gameTimeSim < valeur`. */
  const cooldownUntilSim = ref<Record<string, number>>({})

  function buildDeps(): ActivityEngineDeps {
    const characterStore = useCharacterStore()
    const resourceStore = useResourceStore()
    const gameState = useGameStateStore()
    const logStore = useLogStore()
    const gaugeStore = useGaugeStore()
    const improvementStore = useImprovementStore()

    return {
      addLog: (message) => logStore.addLog(message),
      setFlag: (flag, value) => gameState.setFlag(flag, value ?? true),
      getFlag: (flag) => gameState.getFlag(flag),
      incrementCounter: (counter, by) => gameState.incrementCounter(counter, by),
      addResource: (slug, amount) => resourceStore.addResource(slug, amount),
      spendResource: (costs) => resourceStore.spendResource(costs),
      canAfford: (costs) => resourceStore.canAfford(costs),
      getGaugeQuantity: (slug) => gaugeStore.getGaugeQuantity(slug),
      addGauge: (slug, amt) => gaugeStore.addGauge(slug, amt),
      spendGauge: (slug, qty) => gaugeStore.trySpendGauge(slug, qty),
      getGaugeMax: (slug) => gaugeStore.getGaugeMax(slug),

      getCharacterClass: () => characterStore.getActiveCharacter()?.classType,
      getCharacterSpecialization: () => characterStore.getActiveCharacter()?.specialization,
      getCharacterLevel: () => characterStore.getActiveCharacter()?.level,
      getResourceQuantity: (slug) => resourceStore.getQuantity(slug),
      isImprovementBought: (slug) =>
        improvementStore.improvements.some((i) => i.slug === slug && i.isBought),
    }
  }

  /** Appelé à chaque tick du moteur (même référentiel que prod ressources / jauges). */
  function applyGameTime(simElapsedSeconds: number) {
    gameTimeSim.value = simElapsedSeconds
  }

  function isOnCooldown(slug: string): boolean {
    return gameTimeSim.value < (cooldownUntilSim.value[slug] ?? 0)
  }

  /** Secondes de cooldown restantes (temps sim). */
  function getCooldownRemainingSimSeconds(slug: string): number {
    const until = cooldownUntilSim.value[slug] ?? 0
    return Math.max(0, until - gameTimeSim.value)
  }

  function updateActivityVisibility() {
    const deps = buildDeps()
    activities.value.forEach((act) => {
      act.isVisible = meetsConditions(act, deps)
    })
  }

  function initializeActivities() {
    cooldownUntilSim.value = {}
    updateActivityVisibility()
  }

  function resetCooldowns() {
    cooldownUntilSim.value = {}
  }

  /**
   * Résout une activité : coûts, effets, puis pose le cooldown.
   * Retourne `false` si indisponible (cooldown, conditions, paiement).
   */
  function performActivity(slug: string): boolean {
    if (isOnCooldown(slug)) return false

    const activity = activities.value.find((a) => a.slug === slug)
    if (!activity) return false

    const deps = buildDeps()
    if (!meetsConditions(activity, deps)) return false
    if (!canAffordActivity(activity, deps)) return false
    if (!spendActivityCosts(activity, deps)) return false

    applyActivityEffects(activity.effects, {
      addLog: deps.addLog,
      setFlag: deps.setFlag,
      getFlag: deps.getFlag,
      incrementCounter: deps.incrementCounter,
      addResource: deps.addResource,
      addGauge: deps.addGauge,
      spendGauge: deps.spendGauge,
      getGaugeMax: deps.getGaugeMax,
    })

    if (activity.cooldownSeconds > 0) {
      cooldownUntilSim.value = {
        ...cooldownUntilSim.value,
        [slug]: gameTimeSim.value + activity.cooldownSeconds,
      }
    }

    updateActivityVisibility()
    return true
  }

  function canPerformActivity(slug: string): boolean {
    if (isOnCooldown(slug)) return false
    const activity = activities.value.find((a) => a.slug === slug)
    if (!activity) return false
    const deps = buildDeps()
    return meetsConditions(activity, deps) && canAffordActivity(activity, deps)
  }

  function getActivity(slug: string): ActivityType | undefined {
    return activities.value.find((a) => a.slug === slug)
  }

  return {
    activities,
    applyGameTime,
    initializeActivities,
    resetCooldowns,
    updateActivityVisibility,
    performActivity,
    canPerformActivity,
    isOnCooldown,
    getCooldownRemainingSimSeconds,
    getActivity,
  }
})
