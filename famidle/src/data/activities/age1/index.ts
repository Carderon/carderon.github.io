import type { ActivityType } from '@/types/ActivityType'

/**
 * Activités âge 1 (BRIEF) — déclaratif : coûts, conditions, cooldown, effets.
 */
export const age1Activities: ActivityType[] = [
  {
    slug: 'age1.activity.scavenge',
    name: 'Fouiller',
    flavourText: 'Le crassier et la friche recèlent parfois des chutes de tissu.',
    cooldownSeconds: 8,
    gaugeCosts: [{ gaugeSlug: 'stamina', quantity: 6 }],
    conditions: { requiredFlag: 'ui.flag.activityShown' },
    effects: [
      { kind: 'addResource', resourceSlug: 'age1.resource.cloth', amount: 4 },
      { kind: 'setFlag', flag: 'age1.flag.firstScavengeDone', value: true },
      { kind: 'log', message: 'Vous fouillez le crassier et récupérez du tissu.' },
    ],
    isVisible: false,
  },
  {
    slug: 'age1.activity.gatherWood',
    name: 'Couper du bois',
    flavourText: "À l'orée de la forêt, du petit bois attend.",
    cooldownSeconds: 8,
    gaugeCosts: [{ gaugeSlug: 'stamina', quantity: 6 }],
    conditions: { requiredFlag: 'ui.flag.activityShown' },
    effects: [
      { kind: 'addResource', resourceSlug: 'age1.resource.wood', amount: 5 },
      { kind: 'log', message: "À l'orée de la forêt, vous ramassez du bois." },
    ],
    isVisible: false,
  },
  {
    slug: 'age1.activity.gatherStone',
    name: 'Récupérer de la pierre',
    flavourText: 'Un mur effondré laisse des gravats récupérables.',
    cooldownSeconds: 8,
    gaugeCosts: [{ gaugeSlug: 'stamina', quantity: 6 }],
    conditions: { requiredFlag: 'ui.flag.activityShown' },
    effects: [
      { kind: 'addResource', resourceSlug: 'age1.resource.stone', amount: 5 },
      { kind: 'log', message: 'Près du mur effondré, vous récupérez de la pierre.' },
    ],
    isVisible: false,
  },
  {
    slug: 'age1.activity.sleep',
    name: 'Dormir',
    flavourText: 'Un sommeil court suffit à reprendre des forces.',
    cooldownSeconds: 20,
    conditions: { requiredFlag: 'ui.flag.activityShown' },
    effects: [
      { kind: 'addGauge', gaugeSlug: 'health', amount: Number.MAX_SAFE_INTEGER },
      { kind: 'addGauge', gaugeSlug: 'stamina', amount: Number.MAX_SAFE_INTEGER },
      { kind: 'incrementCounter', counter: 'age1.counter.nightsSlept', by: 1 },
      { kind: 'toggleFlag', flag: 'age1.flag.isNight' },
      { kind: 'log', message: 'Vous dormez un peu. Le corps se détend.' },
    ],
    isVisible: false,
  },
]
