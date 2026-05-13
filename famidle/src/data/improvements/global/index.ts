import type { ImprovementType } from '@/types/ImprovementType.ts'

/**
 * Améliorations globales (toutes ères confondues).
 *
 * Format 100% data-driven : les `effects` sont une union discriminée
 * interprétée par `improvementEngine`. Plus de `callback` impératif.
 *
 * Convention de nommage des flags / counters : `scope.kind.name`
 *   - `ui.flag.<thingShown>`        : visibilité d'une zone d'UI
 *   - `age1.flag.<gameplayFlag>`    : flag scénaristique de l'âge 1
 *   - `age1.counter.<thing>`        : compteur scénaristique de l'âge 1
 * (cf. ARCHITECTURE.md "scope.kind.name")
 *
 * Conventions sur les effets :
 * - effets `setFlag` / `log` / `incrementCounter` : appliqués à l'achat
 * - effet `resourceRate` : appliqué passivement tant que l'amélioration est
 *   achetée (lu par `resourceStore.getResourceRates` via l'engine)
 */
export const globalImprovements: ImprovementType[] = []
