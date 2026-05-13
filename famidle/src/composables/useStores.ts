import { useImprovementStore } from '@/stores/improvementStore'
import { useCharacterStore } from '@/stores/characterStore'

export function useStores() {
  return {
    improvementStore: useImprovementStore(),
    characterStore: useCharacterStore(),
  }
}
