import type { ResourceCostBag } from './ResourceType'

/**
 * Event content type — declarative "brick" used to drive the simulation.
 *
 * Events can be either:
 * - passive: when eligible, apply `effects` immediately
 * - interactive: when eligible, enqueue the event and wait for a player choice
 *
 * The runtime split is intentional:
 * - `src/data/events/**` declares events
 * - `src/engines/events/eventEngine.ts` interprets them (pure functions)
 * - `src/engines/tick/systems/eventsSystem.ts` connects eligibility to the clock
 * - `src/stores/eventStore.ts` owns the interactive queue + choice resolution
 */

/** What makes an event become a candidate for firing. */
export type EventTrigger =
  /** Fires once `ctx.elapsed >= atSeconds`. */
  | { kind: 'time'; atSeconds: number }
  /** Fires when the named flag is set to true. */
  | { kind: 'flag'; flag: string }
  /** Fires when the named counter reaches `atLeast`. */
  | { kind: 'counter'; counter: string; atLeast: number }

/** Side-effect produced when an event fires. */
export type EventEffect =
  /** Append a message to the log feed. */
  | { kind: 'log'; message: string }
  /** Set a flag to true (or to `value` if provided). */
  | { kind: 'setFlag'; flag: string; value?: boolean }
  /** Increment a counter by `by` (default 1). */
  | { kind: 'incrementCounter'; counter: string; by?: number }
  /** Credit a positive `amount` of a resource (capped at the resource max). */
  | { kind: 'addResource'; resourceSlug: string; amount: number }
  /**
   * Debit a positive `amount` of a resource. No-op if the player can't afford
   * it. Prefer declaring such a cost via `EventChoice.costs` so the engine
   * checks affordability **before** applying any effect.
   */
  | { kind: 'spendResource'; resourceSlug: string; amount: number }
  /** Ajoute (soigne) une jauge : montant positif, plafonné au max de la jauge. */
  | { kind: 'addGauge'; gaugeSlug: string; amount: number }

/** Coût payé en jauges (débit au moment du choix). */
export type GaugeCostBag = Readonly<{ gaugeSlug: string; quantity: number }[]>

/**
 * Bag of resource costs (`{ wood: 2, stone: 1 }`).
 *
 * Used by `EventChoice` (and later improvements / tiles). Values must be
 * positive integers; `0` and negatives are ignored by the engine.
 */

/** Player-selectable answer for an interactive event. */
export interface EventChoice {
  /** Stable id unique within the event, e.g. `listen`. */
  id: string
  label: string
  description?: string
  /**
   * Resources the player must own AND will be debited from his inventory
   * before the choice's `effects` run.
   *
   * Atomic: if the player can't pay all costs, the choice is rejected and
   * no effect is applied (the event stays in the queue).
   */
  costs?: ResourceCostBag
  /** Jauges débitées avant d'appliquer les effets (avec les `costs` ressources). */
  gaugeCosts?: GaugeCostBag
  /** Si défini, ce choix n'est proposé que pour cette classe (`warrior`, `mage`, `thief`). */
  requiresClass?: string
  /** Effects applied when this choice is selected. */
  effects: EventEffect[]
}

export interface EventType {
  /** Stable unique id, e.g. `age1.event.wakeUp`. */
  id: string
  /** Short display title for interactive events. */
  title?: string
  /** Body text shown in the event panel. */
  description?: string
  /** Declarative trigger evaluated every tick. */
  trigger: EventTrigger
  /**
   * Effects applied when the event fires.
   *
   * Passive event: these are the whole event outcome.
   * Interactive event: these are applied before the event is queued.
   */
  effects?: EventEffect[]
  /** If present, the event waits for the player to resolve one choice. */
  choices?: EventChoice[]
  /**
   * If true (default), event fires at most once per game session.
   * Set to false for repeating ambient events.
   */
  once?: boolean
  /** Restrict to era >= minEra (inclusive). */
  minEra?: number
  /** Restrict to era <= maxEra (inclusive). */
  maxEra?: number
}
