import type { ResourceType } from '@/types/ResourceType'
import type { GaugeType } from '@/types/GaugeType'
import type { BuildingType } from '@/types/BuildingType'
import type { EventType } from '@/types/EventType'
import type { ImprovementType } from '@/types/ImprovementType'

type GameContent = {
  resources: ResourceType[]
  gauges: GaugeType[]
  buildings: BuildingType[]
  events: EventType[]
  improvements: ImprovementType[]
}

/**
 * Point d’entrée unique pour tout le contenu.
 *
 * Pour l’instant c’est volontairement minimal, le temps de finaliser
 * l’arborescence `data/<domain>/<age>` et de migrer les briques une à une.
 */
export const gameContent: GameContent = {
  resources: [],
  gauges: [],
  buildings: [],
  events: [],
  improvements: [],
}
