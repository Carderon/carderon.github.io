import type { EventType } from '@/types/EventType'

/**
 * Événements globaux (toutes ères confondues).
 *
 * Inclut le `bootstrap` : un event qui se déclenche au tout premier tick
 * (`t=0`) et seed les flags initiaux de l'UI. C'est le moyen "data-driven"
 * de démarrer la chaîne d'unlocks sans toucher au code des stores.
 *
 * Préféré à un seed direct dans `gameStateStore.reset()` parce que :
 * - le store reste générique (aucune connaissance de l'UI)
 * - tout l'état initial visible est déclaré ici, à un endroit
 * - on peut facilement ajouter d'autres seeds (counters, autres flags)
 */
export const globalEvents: EventType[] = [
  {
    id: 'global.event.bootstrap',
    trigger: { kind: 'time', atSeconds: 0 },
    effects: [
      // L'écran de jeu démarre sur la liste des améliorations (firecamp).
      { kind: 'setFlag', flag: 'ui.flag.improvementsShown' },
    ],
  },
]
