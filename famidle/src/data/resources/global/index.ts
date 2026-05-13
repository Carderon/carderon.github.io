import type { ResourceType } from '@/types/ResourceType'

export const globalResources: ResourceType[] = [
  {
    slug: 'global.resource.gold',
    name: "Pièce d'or",
    quantity: 0,
    baseRate: 0,
    max: 20,
    finalRate: 0,
    flavourText: "Il est l'or, mon seign-or",
    conditions: { requiredFlag: 'age1.flag.goldShown' },
    isVisible: true,
  },
  {
    slug: 'global.resource.fame',
    name: 'Notoriété',
    quantity: 0,
    baseRate: 0,
    max: 20,
    finalRate: 0,
    flavourText: 'Notoriété, rançon de la gloire',
    conditions: { requiredFlag: 'age1.flag.fameShown' },
    isVisible: true,
  },
]
