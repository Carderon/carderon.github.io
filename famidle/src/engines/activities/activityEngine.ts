import type { ActivityConditionType, ActivityEffectType, ActivityType } from '@/types/ActivityType'
import type { GaugeCostBag } from '@/types/EventType'
import type { ResourceCostBag } from '@/types/ResourceType'

export interface ActivityEngineDeps {
  addLog: (message: string) => void
  setFlag: (flag: string, value?: boolean) => void
  getFlag: (flag: string) => boolean
  incrementCounter: (counter: string, by?: number) => void
  addResource: (slug: string, amount: number) => void
  spendResource: (costs: ResourceCostBag) => boolean
  canAfford: (costs: ResourceCostBag) => boolean
  getGaugeQuantity: (gaugeSlug: string) => number
  spendGauge: (gaugeSlug: string, quantity: number) => boolean
  addGauge: (gaugeSlug: string, amount: number) => void
  getGaugeMax: (gaugeSlug: string) => number
  getCharacterClass: () => string | undefined
  getCharacterSpecialization: () => string | null | undefined
  getCharacterLevel: () => number | undefined
  getResourceQuantity: (slug: string) => number
  isImprovementBought: (slug: string) => boolean
}

export function meetsConditions(
  activity: ActivityType,
  deps: Pick<
    ActivityEngineDeps,
    | 'getCharacterClass'
    | 'getCharacterSpecialization'
    | 'getCharacterLevel'
    | 'getResourceQuantity'
    | 'isImprovementBought'
    | 'getFlag'
  >,
): boolean {
  const c = activity.conditions
  if (!c) return true

  if (c.requiredFlag && !deps.getFlag(c.requiredFlag)) return false
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

function canAffordGaugeCosts(
  costs: GaugeCostBag | undefined,
  deps: Pick<ActivityEngineDeps, 'getGaugeQuantity'>,
): boolean {
  if (!costs?.length) return true
  for (const { gaugeSlug, quantity } of costs) {
    if (quantity <= 0) continue
    if (deps.getGaugeQuantity(gaugeSlug) < quantity) return false
  }
  return true
}

export function canAffordActivity(
  activity: ActivityType,
  deps: Pick<ActivityEngineDeps, 'canAfford' | 'getGaugeQuantity'>,
): boolean {
  if (activity.costs && !deps.canAfford(activity.costs)) return false
  if (!canAffordGaugeCosts(activity.gaugeCosts, deps)) return false
  return true
}

export function spendActivityCosts(
  activity: ActivityType,
  deps: Pick<ActivityEngineDeps, 'spendResource' | 'spendGauge' | 'canAfford' | 'getGaugeQuantity'>,
): boolean {
  if (!canAffordActivity(activity, deps)) return false
  if (activity.costs && !deps.spendResource(activity.costs)) return false
  if (activity.gaugeCosts) {
    for (const { gaugeSlug, quantity } of activity.gaugeCosts) {
      if (quantity <= 0) continue
      if (!deps.spendGauge(gaugeSlug, quantity)) return false
    }
  }
  return true
}

export function applyActivityEffects(
  effects: readonly ActivityEffectType[] | undefined,
  deps: Pick<
    ActivityEngineDeps,
    | 'addLog'
    | 'setFlag'
    | 'getFlag'
    | 'incrementCounter'
    | 'addResource'
    | 'addGauge'
    | 'spendGauge'
    | 'getGaugeMax'
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
      case 'addGauge':
        deps.addGauge(
          effect.gaugeSlug,
          effect.amount == Number.MAX_SAFE_INTEGER
            ? deps.getGaugeMax(effect.gaugeSlug)
            : effect.amount,
        )
        break
      case 'spendGauge':
        deps.spendGauge(effect.gaugeSlug, effect.amount)
        break
      case 'toggleFlag':
        deps.setFlag(effect.flag, !deps.getFlag(effect.flag))
        break
    }
  }
}
