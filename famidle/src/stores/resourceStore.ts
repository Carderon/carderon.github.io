import { defineStore } from 'pinia'
import { useImprovementStore } from './improvementStore'
import { ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore.ts'
import { useActivityStore } from '@/stores/activityStore'
import { useGameStateStore } from '@/stores/gameStateStore'
import type { ResourceCostBag } from '@/types/ResourceType'
import type { ResourceType } from '@/types/ResourceType'
import { age1Resources } from '@/data/resources/age1'
import { globalResources } from '@/data/resources/global'

/**
 * Runtime state of the player's resources.
 *
 * Each resource has:
 * - a `quantity` (current amount, capped by `max`)
 * - a `baseRate` (passive production per second, before improvement bonuses)
 * - a `finalRate` (recomputed when improvements change, used by `produceResources`)
 * - optional `conditions` controlling visibility (AND) : `requiredFlag`,
 *   classe, spécialisation, niveau, quantités min, amélioration achetée…
 *
 * The store exposes both **passive** mutations (`produceResources` from the
 * tick loop) and **explicit** mutations (`addResource` / `spendResource`)
 * consumed by event/improvement engines.
 */
export const useResourceStore = defineStore('resource', () => {
  const improvementStore = useImprovementStore()
  const characterStore = useCharacterStore()
  const activityStore = useActivityStore()
  const gameState = useGameStateStore()

  const resources = ref<ResourceType[]>([...globalResources, ...age1Resources])

  // ---------- Lectures ----------

  const getResource = (slug: string) => resources.value.find((r) => r.slug === slug)

  const getQuantity = (slug: string): number => getResource(slug)?.quantity ?? 0

  /**
   * `true` si l'inventaire couvre tous les coûts demandés.
   * Une entrée de `quantity <= 0` est ignorée (pratique pour des coûts conditionnels).
   * Un slug inconnu => coût impayable.
   */
  const canAfford = (costs: ResourceCostBag): boolean => {
    for (const { resourceSlug, quantity } of costs) {
      if (quantity <= 0) continue
      const resource = getResource(resourceSlug)
      if (!resource) return false
      if (resource.quantity < quantity) return false
    }
    return true
  }

  // ---------- Mutations ----------

  // Recalcule `finalRate` à partir de `baseRate` + bonus des improvements.
  // À appeler quand un improvement est acheté/changé (pas à chaque frame).
  const getResourceRates = () => {
    resources.value.forEach((resource) => {
      const improvementEffect = improvementStore.getResourceImprovementEffects(resource.slug)
      resource.finalRate = resource.baseRate + improvementEffect
    })
  }

  /**
   * Ajoute (ou retire si négatif) une quantité à une ressource.
   * Borne à `[0, resource.max]` pour rester safe.
   */
  const updateResource = (resourceSlug: string, amount: number) => {
    const resource = getResource(resourceSlug)
    if (!resource) return
    resource.quantity = Math.max(0, Math.min(resource.quantity + amount, resource.max))
  }

  /**
   * Crédite des ressources (équivalent sémantique de `updateResource(slug, +amount)`),
   * exposé pour les effets data-driven `addResource`. Les valeurs négatives sont
   * volontairement refusées : utiliser `spendResource` pour dépenser.
   */
  const addResource = (slug: string, amount: number): void => {
    if (amount <= 0) return
    updateResource(slug, amount)
  }

  /**
   * Tente de payer un panier de coûts atomiquement.
   *
   * - Renvoie `false` (et ne touche à rien) si une seule ressource est insuffisante.
   * - Renvoie `true` après avoir débité chaque ressource concernée.
   *
   * La sémantique "tout ou rien" évite que le joueur perde du bois pour un
   * achat de pierre raté, par exemple.
   */
  const spendResource = (costs: ResourceCostBag): boolean => {
    if (!canAfford(costs)) return false
    for (const { resourceSlug, quantity } of costs) {
      if (quantity <= 0) continue
      updateResource(resourceSlug, -quantity)
    }
    return true
  }

  /**
   * Production des ressources sur un intervalle `dt` (en secondes).
   *
   * Appelé à chaque tick du `ClockEngine` via `resourcesSystem`.
   * Volontairement minimal et idempotent (pas d'appel à updateVisibility ici)
   * pour rester safe à haute fréquence (~60 Hz).
   */
  const produceResources = (dt: number) => {
    if (dt <= 0) return
    resources.value.forEach((resource) => {
      const amountToProduce = resource.finalRate * dt
      if (amountToProduce !== 0) {
        updateResource(resource.slug, amountToProduce)
      }
    })
  }

  /**
   * Recalcule la visibilité des ressources et des améliorations.
   *
   * Pas besoin d'appeler ça à 60 Hz : le `resourcesSystem` le fait
   * une fois par seconde simulée environ.
   *
   * Convention : une condition absente est satisfaite (AND sur les champs
   * présents). Une ressource avec `conditions: {}` est donc visible.
   */
  const recomputeVisibility = () => {
    const currentCharacter = characterStore.getActiveCharacter()
    resources.value = resources.value.map((resource) => {
      const conditions = resource.conditions ?? {}

      const meetsFlagCondition =
        !conditions.requiredFlag || gameState.getFlag(conditions.requiredFlag)

      const meetsQuantityCondition =
        conditions.minResourceQuantity == null ||
        conditions.minResourceQuantity.every(
          ({ resourceSlug, quantity }) => getQuantity(resourceSlug) >= quantity,
        )

      const meetsClassCondition =
        !conditions.requiredClass || currentCharacter?.classType === conditions.requiredClass

      const meetsSpecializationCondition =
        !conditions.requiredSpecialization ||
        currentCharacter?.specialization === conditions.requiredSpecialization

      const meetsLevelCondition =
        conditions.minLevel == null || (currentCharacter?.level ?? 0) >= conditions.minLevel

      const meetsImprovementCondition =
        !conditions.requiredImprovement ||
        improvementStore.getImprovement(conditions.requiredImprovement)?.isBought === true

      const meetsAll =
        meetsFlagCondition &&
        meetsQuantityCondition &&
        meetsClassCondition &&
        meetsSpecializationCondition &&
        meetsLevelCondition &&
        meetsImprovementCondition

      return {
        ...resource,
        isVisible: meetsAll,
      }
    })

    improvementStore.updateImprovementVisibility()
    activityStore.updateActivityVisibility()
  }

  const initializeResources = () => {
    //
  }

  return {
    resources,
    getResource,
    getQuantity,
    canAfford,
    addResource,
    spendResource,
    getResourceRates,
    produceResources,
    recomputeVisibility,
    initializeResources,
  }
})
