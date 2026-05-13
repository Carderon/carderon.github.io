<template>
  <transition name="fade">
    <div v-if="activeEvent" class="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
      <section
        class="w-full max-w-xl rounded-2xl border border-gray-400 bg-white p-6 text-black shadow-xl dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <p class="mb-2 text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-300">Événement</p>
        <h2 class="mb-4 text-2xl font-bold">{{ activeEvent.title || activeEvent.id }}</h2>
        <p v-if="activeEvent.description" class="mb-6 whitespace-pre-line text-sm leading-6">
          {{ activeEvent.description }}
        </p>

        <div class="flex flex-col gap-3">
          <button
            v-for="choice in visibleChoices"
            :key="choice.id"
            class="rounded-xl border border-gray-400 bg-neutral-700 px-4 py-3 text-left text-white transition hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-neutral-700"
            :disabled="!eventStore.isChoiceAffordable(choice)"
            @click="onChoose(choice.id)"
          >
            <span class="block font-bold">{{ choice.label }}</span>
            <span v-if="choice.description" class="mt-1 block text-sm opacity-80">
              {{ choice.description }}
            </span>
            <span
              v-if="choice.costs && hasAnyResourceCost(choice.costs)"
              class="mt-2 block text-xs uppercase tracking-wider"
              :class="eventStore.isChoiceAffordable(choice) ? 'text-amber-300' : 'text-red-300'"
            >
              Coût : {{ formatResourceCosts(choice.costs) }}
            </span>
            <span
              v-if="choice.gaugeCosts && hasAnyGaugeCost(choice.gaugeCosts)"
              class="mt-1 block text-xs uppercase tracking-wider"
              :class="eventStore.isChoiceAffordable(choice) ? 'text-amber-300' : 'text-red-300'"
            >
              Coût jauges : {{ formatGaugeCosts(choice.gaugeCosts) }}
            </span>
          </button>
        </div>
      </section>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEventStore } from '@/stores/eventStore'
import { useCharacterStore } from '@/stores/characterStore'
import type { EventChoice, GaugeCostBag } from '@/types/EventType'
import type { ResourceCostBag } from '@/types/ResourceType'

defineOptions({ name: 'EventPanel' })

const eventStore = useEventStore()
const characterStore = useCharacterStore()
const { activeEvent } = storeToRefs(eventStore)

const visibleChoices = computed<EventChoice[]>(() => {
  const ev = activeEvent.value
  if (!ev?.choices?.length) return []
  const cls = characterStore.getActiveCharacter()?.classType
  return ev.choices.filter((c) => !c.requiresClass || c.requiresClass === cls)
})

function hasAnyResourceCost(costs: ResourceCostBag): boolean {
  return costs.some(({ quantity }) => quantity > 0)
}

function formatResourceCosts(costs: ResourceCostBag): string {
  return costs
    .filter(({ quantity }) => quantity > 0)
    .map(({ resourceSlug, quantity }) => `${quantity} ${resourceSlug}`)
    .join(', ')
}

function hasAnyGaugeCost(costs: GaugeCostBag): boolean {
  return costs.some(({ quantity }) => quantity > 0)
}

const gaugeLabels: Record<string, string> = {
  health: 'vitalité',
  stamina: 'endurance',
}

function formatGaugeCosts(costs: GaugeCostBag): string {
  return costs
    .filter(({ quantity }) => quantity > 0)
    .map(
      ({ gaugeSlug, quantity }) =>
        `${quantity} ${gaugeLabels[gaugeSlug] ?? gaugeSlug}`,
    )
    .join(', ')
}

function onChoose(choiceId: string) {
  if (!activeEvent.value) return
  eventStore.resolveChoice(activeEvent.value.id, choiceId)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
