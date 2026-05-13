<template>
  <transition name="fade">
    <aside v-show="isResourcesShown" class="w-full border-t border-gray-300 p-6 pt-4 dark:border-gray-600">
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
        Ressources
      </h2>
      <ul class="space-y-4">
        <template v-for="resource in resources" :key="resource.slug">
          <li v-if="resource.isVisible" class="group relative">
            <div class="mb-1 flex items-center justify-between gap-2">
              <span class="truncate text-sm font-medium text-black dark:text-white">
                {{ resource.name }}
              </span>
              <span class="shrink-0 tabular-nums text-xs text-gray-600 dark:text-gray-300">
                {{ resource.quantity.toFixed(1) }} / {{ resource.max.toFixed(0) }}
              </span>
            </div>
            <div class="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
              <div class="h-full rounded-full bg-amber-500 transition-[width] duration-300 dark:bg-amber-400"
                :style="{ width: fillPercent(resource) + '%' }" />
            </div>
            <GameTooltip placement="side">
              <p class="text-sm font-semibold">
                {{ resource.finalRate.toFixed(2) }} / s
              </p>
              <p class="mt-1 text-[11px] opacity-90">
                {{ resource.flavourText }}
              </p>
            </GameTooltip>
          </li>
        </template>
      </ul>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import GameTooltip from '@/components/ui/GameTooltip.vue'
import { useResourceStore } from '@/stores/resourceStore'
import { storeToRefs } from 'pinia'
import { computed, onBeforeMount } from 'vue'
import { useGameStateStore } from '@/stores/gameStateStore'
import type { ResourceType } from '@/types/ResourceType'

const gameState = useGameStateStore()
const isResourcesShown = computed(() => gameState.getFlag('ui.flag.resourcesShown'))

const resourceStore = useResourceStore()
const { resources } = storeToRefs(resourceStore)

function fillPercent(resource: ResourceType): number {
  if (resource.max <= 0) return 0
  return Math.min(100, (resource.quantity / resource.max) * 100)
}

onBeforeMount(() => {
  resourceStore.getResourceRates()
})
</script>
