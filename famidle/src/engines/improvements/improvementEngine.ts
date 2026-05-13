import type {
  ImprovementCost,
  ImprovementEffectType,
  ImprovementType,
} from '@/types/ImprovementType'

/**
 * Side-effect interface required by the engine.
 *
 * Mirrors `EventEngineDeps` for symmetry: getters are pure reads, mutators
 * do exactly what they say. Keeping deps explicit makes the engine
 * trivially testable (no Pinia / no Vue).
 */
export interface ImprovementEngineDeps {
  // --- mutators (used by applyEffects / buy) ---
  addLog: (message: string) => void
  setFlag: (flag: string, value?: boolean) => void
  incrementCounter: (counter: string, by?: number) => void
  addResource: (slug: string, amount: number) => void
  spendResource: (costs: ImprovementCost) => boolean

  // --- getters (used by meetsConditions / canAfford) ---
  getCharacterClass: () => string | undefined
  getCharacterSpecialization: () => string | null | undefined
  getCharacterLevel: () => number | undefined
  getResourceQuantity: (slug: string) => number
  canAfford: (costs: ImprovementCost) => boolean
  isImprovementBought: (slug: string) => boolean
}

/**
 * Pure check: does this improvement satisfy all its conditions?
 *
 * Returns `true` if the improvement has no conditions at all.
 *
 * Note: `costs` are NOT checked here. They gate **buyability**, not
 * **visibility** (the player should see he can't afford the upgrade yet).
 * Use `canAffordImprovement` for that.
 */
export function meetsConditions(
  improvement: ImprovementType,
  deps: Pick<
    ImprovementEngineDeps,
    | 'getCharacterClass'
    | 'getCharacterSpecialization'
    | 'getCharacterLevel'
    | 'getResourceQuantity'
    | 'isImprovementBought'
  >,
): boolean {
  const c = improvement.conditions
  if (!c) return true

  if (c.requiredClass && deps.getCharacterClass() !== c.requiredClass) return false
  if (c.requiredSpecialization && deps.getCharacterSpecialization() !== c.requiredSpecialization)
    return false
  if (c.minLevel != null && (deps.getCharacterLevel() ?? 0) < c.minLevel) return false

  if (c.minResourceQuantity) {
    for (const [slug, qty] of Object.entries(c.minResourceQuantity)) {
      if (deps.getResourceQuantity(slug) < qty) return false
    }
  }

  if (c.requiredImprovement && !deps.isImprovementBought(c.requiredImprovement)) return false

  return true
}

/**
 * Pure check: can the player currently pay this improvement's `costs`?
 * Returns `true` for cost-less improvements.
 */
export function canAffordImprovement(
  improvement: ImprovementType,
  deps: Pick<ImprovementEngineDeps, 'canAfford'>,
): boolean {
  if (!improvement.costs) return true
  return deps.canAfford(improvement.costs)
}

/**
 * Pay the improvement's `costs` atomically. Returns `true` if debited
 * (or if no cost was declared). The caller MUST refuse to apply effects when
 * this returns `false`.
 */
export function spendImprovementCosts(
  improvement: ImprovementType,
  deps: Pick<ImprovementEngineDeps, 'spendResource'>,
): boolean {
  if (!improvement.costs) return true
  return deps.spendResource(improvement.costs)
}

/**
 * Apply the **one-shot** effects of an improvement.
 *
 * Called once, at the moment of purchase. Passive effects (like `resourceRate`)
 * are intentionally ignored here: they're computed on demand by
 * `getResourceRateBonus` so they remain active for as long as the improvement
 * is bought (and would stop applying if it were ever sold/disabled).
 */
export function applyEffects(
  effects: readonly ImprovementEffectType[] | undefined,
  deps: Pick<
    ImprovementEngineDeps,
    'addLog' | 'setFlag' | 'incrementCounter' | 'addResource'
  >,
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
      case 'resourceRate':
        // Passive: read continuously by getResourceRateBonus, not applied here.
        break
    }
  }
}

/**
 * Sum the passive `resourceRate` bonuses from all bought improvements
 * for a given resource slug.
 *
 * O(improvements * effects) but both lists are small in practice; can be
 * memoized later if profiling shows it matters.
 */
export function getResourceRateBonus(
  improvements: readonly ImprovementType[],
  resourceSlug: string,
): number {
  let total = 0
  for (const imp of improvements) {
    if (!imp.isBought || !imp.effects) continue
    for (const effect of imp.effects) {
      if (effect.kind === 'resourceRate' && effect.resourceSlug === resourceSlug) {
        total += effect.amount
      }
    }
  }
  return total
}
