import type { GaugeType } from '@/types/GaugeType'

export const globalGauges: GaugeType[] = [
  {
    name: 'Vitalité',
    slug: 'health',
    current: 100,
    max: 100,
    regenRate: 0.5,
    finalRegenRate: 0,
    flavourText: 'Énergie vitale, le néant vaut la mort',
    color: 'red',
  },
  {
    name: 'Endurance',
    slug: 'stamina',
    current: 50,
    max: 50,
    regenRate: 0.2,
    finalRegenRate: 0,
    flavourText: 'Énergie musculaire, le néant vaut le manque de souffle',
    color: 'green',
  },
]
