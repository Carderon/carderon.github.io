import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { EventChoice, EventType } from '@/types/EventType'
import {
  applyEffects,
  canResolveChoice,
  spendChoiceCosts,
  type EventEngineDeps,
} from '@/engines/events/eventEngine'
import { useGameStateStore } from './gameStateStore'
import { useGaugeStore } from './gaugeStore'
import { useLogStore } from './logStore'
import { useResourceStore } from './resourceStore'

/**
 * Runtime queue for interactive events.
 *
 * Eligibility is still handled by `eventsSystem` on each tick. This store only
 * owns events that are waiting for a player choice, and resolves the selected
 * choice by applying its declarative effects through `eventEngine`.
 */
export const useEventStore = defineStore('event', () => {
  const queuedEvents = ref<EventType[]>([])

  const activeEvent = computed(() => queuedEvents.value[0] ?? null)
  const hasPendingEvent = computed(() => queuedEvents.value.length > 0)

  function buildDeps(): EventEngineDeps {
    const gameState = useGameStateStore()
    const logStore = useLogStore()
    const resourceStore = useResourceStore()
    const gaugeStore = useGaugeStore()

    return {
      addLog: (message) => logStore.addLog(message),
      getFlag: (flag) => gameState.getFlag(flag),
      setFlag: (flag, value) => gameState.setFlag(flag, value),
      getCounter: (counter) => gameState.getCounter(counter),
      incrementCounter: (counter, by) => gameState.incrementCounter(counter, by),
      addResource: (slug, amount) => resourceStore.addResource(slug, amount),
      spendResource: (costs) => resourceStore.spendResource(costs),
      canAfford: (costs) => resourceStore.canAfford(costs),
      getGaugeQuantity: (slug) => gaugeStore.getGaugeQuantity(slug),
      spendGauge: (slug, qty) => gaugeStore.trySpendGauge(slug, qty),
      addGauge: (slug, amt) => gaugeStore.addGauge(slug, amt),
    }
  }

  function enqueueEvent(event: EventType): void {
    if (!event.choices?.length) return
    if (queuedEvents.value.some((queued) => queued.id === event.id)) return
    queuedEvents.value.push(event)
  }

  /**
   * Pure read used by the UI to disable un-affordable choice buttons.
   * No mutation: lives next to the queue so callers don't have to wire deps.
   */
  function isChoiceAffordable(choice: EventChoice): boolean {
    return canResolveChoice(choice, buildDeps())
  }

  /**
   * Resolve the chosen answer for an event in the queue.
   *
   * Returns `false` and leaves the event in the queue if:
   * - the event/choice doesn't exist
   * - the choice has `costs` the player can't pay
   *
   * On success: pays the costs (atomically), applies the choice's effects,
   * and removes the event from the queue.
   */
  function resolveChoice(eventId: string, choiceId: string): boolean {
    const eventIndex = queuedEvents.value.findIndex((event) => event.id === eventId)
    if (eventIndex < 0) return false

    const event = queuedEvents.value[eventIndex]
    const choice = event.choices?.find((candidate) => candidate.id === choiceId)
    if (!choice) return false

    const deps = buildDeps()
    if (!spendChoiceCosts(choice, deps)) return false

    applyEffects(choice.effects, deps)
    queuedEvents.value.splice(eventIndex, 1)
    return true
  }

  function clear(): void {
    queuedEvents.value = []
  }

  return {
    queuedEvents,
    activeEvent,
    hasPendingEvent,
    enqueueEvent,
    isChoiceAffordable,
    resolveChoice,
    clear,
  }
})
