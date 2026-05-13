<template>
  <transition name="fade">
    <div v-show="isGaugesShown" class="p-6 pb-2">
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
        Jauges
      </h2>
      <ul>
        <li v-for="gauge in gauges" :key="gauge.slug"
          class="group relative flex items-center w-full justify-between mb-4 gap-6">
          <div class="flex items-center space-x-2 w-1/4">
            <span class="text-sm font-medium text-black dark:text-white">{{ gauge.name.substring(0, 3) }}.</span>
          </div>

          <!-- Barre de jauge -->
          <div class="relative flex h-5 w-3/4 items-center rounded-full bg-gray-200 dark:bg-gray-600">
            <!-- Partie remplie de la jauge -->
            <div :class="`h-full bg-${gauge.color}-500 rounded-full absolute transition-all duration-300`"
              :style="{ width: (gauge.current / gauge.max) * 100 + '%' }">
            </div>
            <span
              class="z-50 w-full p-2 text-center text-xs font-bold text-gray-800 dark:text-gray-100"
              :class="{
                'text-gray-700 dark:text-gray-200': gauge.current / gauge.max >= 0.5,
                'text-amber-600 dark:text-amber-300':
                  gauge.current / gauge.max < 0.5 && gauge.current / gauge.max > 0.2,
                'text-red-600 dark:text-red-400': gauge.current / gauge.max <= 0.2,
              }"
              >{{ gauge.current.toFixed(2) }} / {{ gauge.max.toFixed(2) }}</span>
          </div>

          <GameTooltip placement="side">
            <p class="text-sm font-semibold">
              {{ gauge.finalRegenRate.toFixed(2) }} / s — {{ gauge.name }}
            </p>
            <p class="mt-1 text-[11px] opacity-90">
              {{ gauge.flavourText }}
            </p>
          </GameTooltip>
        </li>
      </ul>
    </div>
  </transition>
</template>

<script setup lang="ts">
import GameTooltip from '@/components/ui/GameTooltip.vue'
import { useGaugeStore } from '@/stores/gaugeStore';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount } from 'vue';
import { useGameStateStore } from '@/stores/gameStateStore';

const gameState = useGameStateStore();
const gaugeStore = useGaugeStore();
const { gauges } = storeToRefs(gaugeStore);

const isGaugesShown = computed(() => gameState.getFlag('ui.flag.gaugesShown'));

onBeforeMount(() => {
  gaugeStore.getGaugeRates(); // Mettre à jour les taux de régénération au début
});
</script>
