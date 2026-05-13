import type { ResourceType } from '@/types/ResourceType'

export const age1Resources: ResourceType[] = [
  {
    slug: 'age1.resource.wood',
    name: 'Bois',
    quantity: 0,
    baseRate: 0,
    max: 120,
    finalRate: 0,
    flavourText: 'Sec, ça brûle. Humide, ça fume.',
    conditions: {},
    isVisible: true,
  },
  {
    slug: 'age1.resource.stone',
    name: 'Pierre',
    quantity: 0,
    baseRate: 0,
    max: 120,
    finalRate: 0,
    flavourText: "Un peu de pierre, c'est mieux.",
    conditions: {},
    isVisible: true,
  },
  {
    slug: 'age1.resource.cloth',
    name: 'Tissu',
    quantity: 0,
    baseRate: 0,
    max: 120,
    finalRate: 0,
    flavourText: "Déchiré, poussiéreux — mais encore utile.",
    conditions: {},
    isVisible: true,
  },
]
