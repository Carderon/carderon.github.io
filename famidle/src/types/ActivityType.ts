import type { GaugeCostBag } from '@/types/EventType'
import type { ResourceCostBag } from '@/types/ResourceType'

/**
 * Conditions pour qu'une activité soit visible / utilisable (ET logique).
 * Proche des améliorations, avec un flag optionnel (déblocage UI, quêtes…).
 */
export interface ActivityConditionType {
  requiredClass?: string
  requiredSpecialization?: string
  minLevel?: number
  minResourceQuantity?: Record<string, number>
  requiredImprovement?: string
  /** Le flag doit être `true` (ex. `ui.flag.activityShown`). */
  requiredFlag?: string
}

/** Effets one-shot appliqués au moment où l'activité est résolue. */
export type ActivityEffectType =
  | { kind: 'log'; message: string }
  | { kind: 'setFlag'; flag: string; value?: boolean }
  | { kind: 'incrementCounter'; counter: string; by?: number }
  | { kind: 'addResource'; resourceSlug: string; amount: number }
  | { kind: 'addGauge'; gaugeSlug: string; amount: number }
  | { kind: 'spendGauge'; gaugeSlug: string; amount: number }
  | { kind: 'toggleFlag'; flag: string }

export interface ActivityType {
  slug: string
  name: string
  flavourText?: string
  /** Délai minimum entre deux utilisations (secondes). */
  cooldownSeconds: number
  costs?: ResourceCostBag
  gaugeCosts?: GaugeCostBag
  conditions?: ActivityConditionType
  effects?: ActivityEffectType[]
  /** Mis à jour par `activityStore.updateActivityVisibility`. */
  isVisible: boolean
}
