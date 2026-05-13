<template>
  <div role="tooltip"
    class="pointer-events-none invisible absolute z-[200] opacity-0 shadow-lg transition-all duration-200 delay-75 group-hover:visible group-hover:opacity-100 rounded-lg border border-gray-500 bg-neutral-800 p-3 text-left text-xs leading-relaxed text-white dark:border-gray-600 dark:bg-neutral-900"
    :class="[
      placementClass,
      props.panelClass,
    ]">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Tooltip unifié (survol du parent `.group`).
 * - `below` : sous le déclencheur
 * - `above` : au-dessus (utile sur une grille pour ne pas passer sous la ligne du dessous)
 * - `side` : à droite
 */
const props = withDefaults(
  defineProps<{
    placement?: 'below' | 'above' | 'side'
    panelClass?: string
  }>(),
  /** Comportement historique : sans prop, équivalent à `side`. */
  { placement: 'side', panelClass: '' },
)

const placementClass = computed(() => {
  if (props.placement === 'below') {
    return 'left-0 top-full mt-1.5 w-64 whitespace-normal'
  }
  if (props.placement === 'above') {
    return 'left-0 bottom-full mb-1.5 w-64 whitespace-normal'
  }
  return 'left-full top-1/2 ml-2 w-64 max-w-[min(16rem,calc(100vw-8rem))] -translate-y-1/2 whitespace-normal'
})
</script>
