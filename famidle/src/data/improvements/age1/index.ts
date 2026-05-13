import type { ImprovementType } from '@/types/ImprovementType'

export const age1Improvements: ImprovementType[] = [
  {
    slug: 'age1.improvement.firecamp',
    name: 'Allumer un feu',
    buildTime: 10,
    isBought: false,
    isVisible: false,
    effects: [
      { kind: 'setFlag', flag: 'ui.flag.badgesShown' },
      { kind: 'setFlag', flag: 'age1.flag.firecampLit' },
      { kind: 'log', message: 'Le feu est allumé.' },
    ],
    costs: [{ resourceSlug: 'age1.resource.wood', quantity: 1 }],
    flavourText: "Un feu, c'est mieux.",
  },
  {
    slug: 'age1.improvement.remember',
    name: 'Se rappeler',
    buildTime: 5,
    isVisible: false,
    effects: [
      { kind: 'setFlag', flag: 'ui.flag.logsShown' },
      {
        kind: 'log',
        message:
          "La nuit a été courte, les idées confuses. Une idée vous traverse l'esprit : vous savez ce que vous êtes, pour l'instant.",
      },
    ],
    isBought: false,
    conditions: { requiredImprovement: 'age1.improvement.firecamp' },
  },
  {
    slug: 'age1.improvement.checkout',
    name: "S'ausculter",
    buildTime: 5,
    isVisible: false,
    conditions: { requiredImprovement: 'age1.improvement.remember' },
    effects: [
      { kind: 'setFlag', flag: 'ui.flag.gaugesShown' },
      { kind: 'log', message: 'Tout est en place.' },
    ],
    isBought: false,
  },
  {
    slug: 'age1.improvement.take-stock',
    name: "Faire l'état des lieux",
    buildTime: 5,
    isVisible: false,
    conditions: { requiredImprovement: 'age1.improvement.checkout' },
    effects: [
      { kind: 'setFlag', flag: 'ui.flag.resourcesShown' },
      { kind: 'log', message: 'Il ne reste pas grand chose.' },
    ],
    isBought: false,
  },
  {
    slug: 'age1.improvement.take-a-look',
    name: 'Regarder autour de soi',
    buildTime: 5,
    isVisible: false,
    conditions: { requiredImprovement: 'age1.improvement.take-stock' },
    effects: [
      { kind: 'setFlag', flag: 'ui.flag.monumentShown' },
      { kind: 'log', message: 'Tout a été retournée, brisée, ou détruit.' },
    ],
    isBought: false,
  },
  {
    slug: 'age1.improvement.what-to-do',
    name: 'Que faire ?',
    buildTime: 5,
    isVisible: false,
    conditions: { requiredImprovement: 'age1.improvement.take-a-look' },
    effects: [
      { kind: 'setFlag', flag: 'ui.flag.activityShown' },
      { kind: 'log', message: 'Il y a tellement à faire !' },
    ],
    isBought: false,
  },
]
