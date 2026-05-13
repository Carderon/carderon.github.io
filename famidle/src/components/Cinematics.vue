<template>
  <div class="absolute inset-0 bg-animation" :class="backgroundClass"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useImprovementStore } from '@/stores/improvementStore';

const improvementStore = useImprovementStore();
const { improvements } = storeToRefs(improvementStore);

// Calculer la classe dynamique pour le fond
const backgroundClass = computed(() => {
  const firecamp = improvements.value.find((imp) => imp.slug === 'firecamp');
  return firecamp?.isBought ? 'bg-white' : 'bg-slate-950';
});
</script>

<style scoped>
.bg-animation {
  transition: background-color 1s;
}
.bg-slate-950 {
  background-color: #0f172a;
}
.bg-transition {
  background-color: #ffffff;
}
</style>
