<template>
  <div class="h-full">
    <h1 class="text-2xl font-bold h-[10rem] text-black dark:text-white">
      {{ currentCharacter?.name || '' }}
      {{ currentClassName }}
    </h1>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCharacterStore } from '@/stores/characterStore';
import { useClassStore } from '@/stores/classeStore';
import { storeToRefs } from 'pinia';

const characterStore = useCharacterStore();
const classStore = useClassStore();
const { classes } = storeToRefs(classStore);

const currentCharacter = computed(() => characterStore.getActiveCharacter());
const currentClassName = computed(() => {
  return classes.value.find((classItem) => classItem.slug === currentCharacter.value?.classType)?.name || '';
});
</script>
