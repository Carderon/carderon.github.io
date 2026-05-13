<template>
  <div class="flex-1 h-full">
    <h2 class="text-xl font-bold text-black dark:text-white mb-4 hidden">Améliorations</h2>
    <ul class="flex flex-col items-start">
      <template v-for="improvement in improvements" :key="improvement.slug">
        <li v-if="improvement.isVisible && !improvement.isBought" class="flex items-center justify-center">
          <ImprovementButton :improvement="improvement" />
        </li>
      </template>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useImprovementStore } from '@/stores/improvementStore.ts';
import { storeToRefs } from 'pinia'
import ImprovementButton from '@/components/improvements/ImprovementButton.vue'

const improvementStore = useImprovementStore();
const { improvements } = storeToRefs(improvementStore);
</script>
