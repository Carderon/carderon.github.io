import type { ResourceCostBag } from '@/types/ResourceType'

/**
 * Conditions that gate an improvement (visibility + buyability).
 *
 * Every field is optional: a missing field means the constraint doesn't apply.
 * All present fields must be satisfied (logical AND) for the improvement to
 * appear in the UI / be buyable.
 */
export interface ImprovementConditionType {
  /** Restrict to a specific class slug (e.g. `warrior`). */
  requiredClass?: string
  /** Restrict to a specific specialization (e.g. `fantassin`). */
  requiredSpecialization?: string
  /** Minimum character level. */
  minLevel?: number
  /** Minimum quantity per resource slug, e.g. `{ wood: 5, stone: 2 }`. */
  minResourceQuantity?: Record<string, number>
  /** Slug of an improvement that must already be bought. */
  requiredImprovement?: string
}

/**
 * Effect produced by an improvement.
 *
 * Discriminated union (mirrors `EventEffect`). Two natures of effect coexist:
 *
 * - **One-shot effects** (`log`, `setFlag`, `incrementCounter`):
 *   applied EXACTLY ONCE, when the improvement is bought.
 *   Handled by `improvementEngine.applyEffects`.
 *
 * - **Passive effects** (`resourceRate`):
 *   applied CONTINUOUSLY for as long as the improvement is bought.
 *   Read on demand by `improvementEngine.getResourceRateBonus`
 *   (called from `resourceStore.getResourceRates`).
 *
 * Splitting "what is an effect" from "when is it applied" lets us keep both
 * the engine and the data (`globalImprovements`) declarative.
 */
export type ImprovementEffectType =
  /** Passive: flat additive bonus on a resource's production rate. */
  | { kind: 'resourceRate'; resourceSlug: string; amount: number }
  /** Passive: flat additive bonus on a gauge's production rate. */
  | { kind: 'gaugeRate'; gaugeSlug: string; amount: number }
  /** One-shot: append a message to the log feed. */
  | { kind: 'log'; message: string }
  /** One-shot: set a flag (default `true`). */
  | { kind: 'setFlag'; flag: string; value?: boolean }
  /** One-shot: increment a counter by `by` (default 1). */
  | { kind: 'incrementCounter'; counter: string; by?: number }
  /** One-shot: credit a positive `amount` of a resource (capped at max). */
  | { kind: 'addResource'; resourceSlug: string; amount: number }

/**
 * Resource costs paid atomically when the improvement is bought.
 *
 * Aliased on `ResourceCostBag` (one canonical shape across every "spending"
 * surface of the game: events, improvements, tiles). Gauge costs will live
 * on a separate type if/when they're needed, to keep this one narrow.
 */
export type ImprovementCost = ResourceCostBag

export interface ImprovementType {
  name: string
  slug: string
  /**
   * Free-form short text shown to the player (tooltip, lore).
   * Pure UI, never read by the engine.
   */
  flavourText?: string
  /** Time (in seconds) the player must wait before the improvement is bought. */
  buildTime: number
  effects?: ImprovementEffectType[]
  conditions?: ImprovementConditionType
  /** Resources debited at purchase time. */
  costs?: ImprovementCost
  isBought: boolean
  isVisible: boolean
}
