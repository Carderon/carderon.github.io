import type { ImprovementType } from '@/types/ImprovementType'
import { globalImprovements } from './global'
import { age1Improvements } from './age1'

/**
 * Single source of truth for improvements consumed by `improvementStore`.
 *
 * Keeping it as a flat concatenation (vs an `EventLoader`-style class) for
 * now because:
 * - improvements aren't filtered by era at load time (visibility is computed
 *   at runtime via conditions)
 * - the array is small and rarely traversed in hot paths
 *
 * When age1/age2 specific improvement files are added, just import and spread
 * them here.
 */
export const improvementsData: ImprovementType[] = [...globalImprovements, ...age1Improvements]
