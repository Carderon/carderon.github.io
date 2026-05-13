import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store of "small persistent state" that drives the simulation:
 * - **flags** : booleans (`age1.flag.firstScavengeDone`)
 * - **counters** : integers (`age1.counter.tilesRepaired`)
 *
 * Flags and counters are intentionally combined in a single store because:
 * - they share the same lifecycle (set/reset on game start, persisted later)
 * - they're consumed together by the event engine via a single deps object
 * - keeping the surface area small reduces wiring boilerplate
 *
 * Naming convention: `scope.kind.name`, e.g. `age1.flag.firstNightSurvived`.
 *
 * This store is the canonical bridge between gameplay actions
 * (e.g. `worldStore.repairTile`) and the event engine that watches state.
 */
export const useGameStateStore = defineStore('gameState', () => {
  const flags = ref<Record<string, boolean>>({})
  const counters = ref<Record<string, number>>({})

  // ---------- Flags ----------

  function getFlag(flag: string): boolean {
    return flags.value[flag] === true
  }

  function setFlag(flag: string, value = true): void {
    flags.value[flag] = value
  }

  // ---------- Counters ----------

  function getCounter(counter: string): number {
    return counters.value[counter] ?? 0
  }

  function setCounter(counter: string, value: number): void {
    counters.value[counter] = value
  }

  function incrementCounter(counter: string, by = 1): void {
    counters.value[counter] = (counters.value[counter] ?? 0) + by
  }

  /** Reset all flags and counters. Useful on game restart. */
  function reset(): void {
    flags.value = {}
    counters.value = {}
  }

  return {
    flags,
    counters,
    getFlag,
    setFlag,
    getCounter,
    setCounter,
    incrementCounter,
    reset,
  }
})
