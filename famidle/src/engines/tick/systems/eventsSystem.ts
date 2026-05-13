import type { TickSystem } from '@/types/TickType'
import type { EventType } from '@/types/EventType'
import { EventLoader } from '@/engines/events/EventLoader'
import { applyEffects, isEligible, type EventEngineDeps } from '@/engines/events/eventEngine'

/**
 * Dependencies the events system needs to do its job.
 * Provided by the caller (typically `clockStore`) to keep the system pure
 * and free of direct Pinia/Vue imports.
 */
export interface EventsSystemDeps extends EventEngineDeps {
  /** Returns the current era of the active character (0 = global only). */
  getEra: () => number
  /** Queue an interactive event so the player can pick one choice. */
  enqueueEvent: (event: EventType) => void
}

/**
 * Tick system that drives the event engine.
 *
 * On every tick:
 * 1. ask `EventLoader` for the events of the current era (+ global events)
 * 2. for each event, check eligibility via `eventEngine.isEligible`
 * 3. if eligible:
 *    - passive event: apply its effects immediately
 *    - interactive event (`choices`): apply entry effects, then enqueue it
 *
 * Anti-spam:
 * - `once` events (default) fire at most once per session, tracked in a `Set`
 * - the set is cleared on `onStart` so a fresh `clock.start()` resets state
 *
 * Note: effects run in declaration order. Effects that mutate flags/counters
 * (e.g. `setFlag`) become visible to subsequent eligibility checks within the
 * SAME tick (since we re-read state via deps, not via a snapshot). This makes
 * it possible to chain events deterministically: an event that sets a flag
 * can immediately unblock another event that watches that flag.
 */
export function createEventsSystem(deps: EventsSystemDeps): TickSystem {
  const triggered = new Set<string>()

  return {
    id: 'events',

    onStart() {
      triggered.clear()
    },

    onTick(ctx) {
      const era = deps.getEra()

      const candidates = [...EventLoader.getEventsForAge(0), ...EventLoader.getEventsForAge(era)]

      for (const event of candidates) {
        const isOnce = event.once !== false
        if (isOnce && triggered.has(event.id)) continue
        if (!isEligible(event, ctx, era, deps)) continue

        applyEffects(event.effects, deps)
        if (event.choices?.length) {
          deps.enqueueEvent(event)
        }
        if (isOnce) triggered.add(event.id)
      }
    },
  }
}
