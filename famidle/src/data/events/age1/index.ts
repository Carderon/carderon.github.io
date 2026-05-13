import type { EventType } from '@/types/EventType'

/**
 * Événements de l'âge 1.
 *
 * Contenu de démonstration utilisé pour valider la chaîne :
 *   ClockEngine → eventsSystem → eventEngine → (logStore | gameStateStore | resourceStore) → UI
 *
 * Démontre :
 * - les 3 kinds de triggers (`time`, `flag`, `counter`)
 * - les events passifs (`effects`)
 * - les events interactifs (`choices`) avec coûts payants
 * - les effets ressources (`addResource`)
 */
export const age1Events: EventType[] = [
  // 1) Trigger temporel — l'event de réveil
  {
    id: 'age1.event.wakeUp',
    trigger: { kind: 'time', atSeconds: 2 },
    effects: [
      { kind: 'log', message: 'Tu te réveilles dans une chambre poussiéreuse.' },
      { kind: 'setFlag', flag: 'age1.flag.awake' },
    ],
  },

  // 2) Trigger temporel — petit drop de bois pour amorcer l'économie
  {
    id: 'age1.event.firewoodHandful',
    trigger: { kind: 'time', atSeconds: 4 },
    effects: [
      { kind: 'log', message: 'Un vieux fagot traîne au pied du lit. Tu le ramasses.' },
      { kind: 'addResource', resourceSlug: 'age1.resource.wood', amount: 1 },
    ],
  },

  // 3) Trigger flag + choices payants — réagit au flag posé par l'achat de firecamp
  {
    id: 'age1.event.firstNoise',
    title: 'Un bruit dans le couloir',
    description:
      'Un grincement résonne au bout du couloir. La maison n’est peut-être pas aussi vide que tu l’espérais.',
    trigger: { kind: 'flag', flag: 'age1.flag.firecampLit' },
    effects: [{ kind: 'log', message: 'Un grincement résonne au bout du couloir.' }],
    choices: [
      {
        id: 'listen',
        label: 'Tendre l’oreille',
        description:
          'Rester immobile et essayer de comprendre d’où vient le bruit. Tu repères du petit bois utilisable.',
        effects: [
          {
            kind: 'log',
            message: 'Tu retiens ton souffle. Trois bouts de bois traînent à portée.',
          },
          { kind: 'addResource', resourceSlug: 'age1.resource.wood', amount: 3 },
          { kind: 'setFlag', flag: 'age1.flag.noiseInvestigated' },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignorer',
        description: 'Tu as assez de problèmes pour l’instant.',
        effects: [
          { kind: 'log', message: 'Tu choisis de ne pas bouger. Le silence finit par revenir.' },
          { kind: 'setFlag', flag: 'age1.flag.noiseIgnored' },
        ],
      },
    ],
  },

  /** BRIEF : après 3 cases réparées — choix soin vitalité / endurance. */
  {
    id: 'age1.event.souvenir',
    title: 'Vous trouvez un souvenir',
    description: 'Un petit objet enfoui sous les gravats capte votre attention.',
    trigger: { kind: 'counter', counter: 'age1.counter.tilesRepaired', atLeast: 3 },
    effects: [{ kind: 'log', message: 'Quelque chose attire votre regard sous la poussière.' }],
    choices: [
      {
        id: 'later',
        label: 'Remettre à plus tard',
        description: 'Vous rangez l’objet sans le déballer.',
        effects: [
          { kind: 'addGauge', gaugeSlug: 'health', amount: 25 },
          { kind: 'log', message: 'Une chaleur apaise votre corps.' },
        ],
      },
      {
        id: 'understand',
        label: 'Prendre le temps de comprendre',
        description: 'Quelques instants de calme.',
        effects: [
          { kind: 'addGauge', gaugeSlug: 'stamina', amount: 15 },
          { kind: 'log', message: 'Votre souffle se fait plus régulier.' },
        ],
      },
    ],
  },

  /** BRIEF : après la 1re nuit (sommeil). */
  {
    id: 'age1.event.firstNightForest',
    title: 'Du bruit dans la forêt',
    description: 'Quelque chose est tombé à l’orée des arbres.',
    trigger: { kind: 'counter', counter: 'age1.counter.nightsSlept', atLeast: 1 },
    effects: [{ kind: 'log', message: 'La nuit porte des sons rares.' }],
    choices: [
      {
        id: 'goSee',
        label: 'Aller voir',
        description: 'Vous risquez un aller-retour pénible.',
        gaugeCosts: [{ gaugeSlug: 'health', quantity: 12 }],
        effects: [
          { kind: 'addResource', resourceSlug: 'age1.resource.wood', amount: 50 },
          { kind: 'log', message: 'Vous ramenez un tas de bois utilisable.' },
        ],
      },
      {
        id: 'stay',
        label: 'Ne rien faire',
        description: 'Le stress vous épuise un peu.',
        gaugeCosts: [{ gaugeSlug: 'stamina', quantity: 6 }],
        effects: [{ kind: 'log', message: 'Vous restez figé.e. Le sommeil vous quitte mal.' }],
      },
    ],
  },

  /** BRIEF : après la première fouille (activité). */
  {
    id: 'age1.event.scavengeDiscovery',
    title: 'Sous les déchets',
    description: 'Il y a quelque chose d’important sous les gravats.',
    trigger: { kind: 'flag', flag: 'age1.flag.firstScavengeDone' },
    effects: [{ kind: 'log', message: 'Votre fouille révèle une cache dissimulée.' }],
    choices: [
      {
        id: 'force',
        label: 'Forcer pour trouver',
        description: 'Coûteux en effort.',
        gaugeCosts: [
          { gaugeSlug: 'stamina', quantity: 18 },
          { gaugeSlug: 'health', quantity: 8 },
        ],
        effects: [
          { kind: 'addResource', resourceSlug: 'age1.resource.cloth', amount: 50 },
          { kind: 'log', message: 'Le vide laisse des traces sur vos mains.' },
        ],
      },
      {
        id: 'thiefClever',
        label: 'Examiner avec astuce',
        description: 'Réservé au voleur.',
        requiresClass: 'thief',
        effects: [
          { kind: 'addResource', resourceSlug: 'age1.resource.cloth', amount: 60 },
          { kind: 'log', message: 'Une ouverture se dessine sans effort.' },
        ],
      },
    ],
  },
]
