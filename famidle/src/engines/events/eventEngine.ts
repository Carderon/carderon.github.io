import type { EventChoice, EventEffect, EventType } from '@/types/EventType'
import type { ResourceCostBag } from '@/types/ResourceType'
import type { TickContext } from '@/types/TickType'

/**
 * Side-effect interface required by the engine.
 * Keeping this as an explicit dependency object makes the engine easy to test
 * and keeps it decoupled from Pinia / Vue.
 *
 * Conventions:
 * - getters are pure reads (no side-effect)
 * - mutators do exactly what they say (no implicit side-effects)
 */
export interface EventEngineDeps {
  addLog: (message: string) => void
  getFlag: (flag: string) => boolean
  setFlag: (flag: string, value?: boolean) => void
  getCounter: (counter: string) => number
  incrementCounter: (counter: string, by?: number) => void
  addResource: (slug: string, amount: number) => void
  spendResource: (costs: ResourceCostBag) => boolean
  canAfford: (costs: ResourceCostBag) => boolean
  getGaugeQuantity: (gaugeSlug: string) => number
  spendGauge: (gaugeSlug: string, quantity: number) => boolean
  addGauge: (gaugeSlug: string, amount: number) => void
}

/**
 * Pure check: is this event currently eligible to fire?
 *
 * Does NOT track "already fired" — that's the responsibility of the caller
 * (typically `eventsSystem` keeps a `Set<EventId>`).
 */
export function isEligible(
  event: EventType,
  ctx: TickContext,
  era: number,
  deps: Pick<EventEngineDeps, 'getFlag' | 'getCounter'>,
): boolean {
  if (event.minEra != null && era < event.minEra) return false
  if (event.maxEra != null && era > event.maxEra) return false

  switch (event.trigger.kind) {
    case 'time':
      return ctx.elapsed >= event.trigger.atSeconds
    case 'flag':
      return deps.getFlag(event.trigger.flag)
    case 'counter':
      return deps.getCounter(event.trigger.counter) >= event.trigger.atLeast
  }
}

/**
 * Pure check: can the player currently afford this choice?
 *
 * Returns `true` if the choice has no costs at all.
 */
export function canResolveChoice(
  choice: EventChoice,
  deps: Pick<EventEngineDeps, 'canAfford' | 'getGaugeQuantity'>,
): boolean {
  if (choice.costs && !deps.canAfford(choice.costs)) return false
  if (choice.gaugeCosts) {
    for (const { gaugeSlug, quantity } of choice.gaugeCosts) {
      if (quantity <= 0) continue
      if (deps.getGaugeQuantity(gaugeSlug) < quantity) return false
    }
  }
  return true
}

/** Apply every effect of an event or event choice using the provided dependencies. */
export function applyEffects(
  effects: readonly EventEffect[] | undefined,
  deps: EventEngineDeps,
): void {
  if (!effects) return
  for (const effect of effects) {
    switch (effect.kind) {
      case 'log':
        deps.addLog(effect.message)
        break
      case 'setFlag':
        deps.setFlag(effect.flag, effect.value ?? true)
        break
      case 'incrementCounter':
        deps.incrementCounter(effect.counter, effect.by ?? 1)
        break
      case 'addResource':
        deps.addResource(effect.resourceSlug, effect.amount)
        break
      case 'spendResource':
        // Best-effort: a single-resource debit. For multi-resource atomic
        // payments, declare them via `EventChoice.costs` instead — these run
        // through `spendChoiceCosts` which is checked by `canResolveChoice`
        // before any effect is applied.
        deps.spendResource([{ resourceSlug: effect.resourceSlug, quantity: effect.amount }])
        break
      case 'addGauge':
        deps.addGauge(effect.gaugeSlug, effect.amount)
        break
    }
  }
}

/**
 * Pay the costs of a choice atomically.
 *
 * Returns `true` if the costs were debited (or if there were none),
 * `false` otherwise (in which case the caller MUST NOT apply effects).
 */
export function spendChoiceCosts(
  choice: EventChoice,
  deps: Pick<EventEngineDeps, 'spendResource' | 'spendGauge' | 'canAfford' | 'getGaugeQuantity'>,
): boolean {
  if (!canResolveChoice(choice, deps)) return false
  if (choice.costs && !deps.spendResource(choice.costs)) return false
  if (choice.gaugeCosts) {
    for (const { gaugeSlug, quantity } of choice.gaugeCosts) {
      if (quantity <= 0) continue
      if (!deps.spendGauge(gaugeSlug, quantity)) return false
    }
  }
  return true
}
