<template>
  <div class="flex items-center justify-center ">
    <img :src="badgeImage" :alt="`Era Badge`" class="h-[200px] w-[200px]" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCharacterStore } from '@/stores/characterStore.ts'

const badgeStages = [
  '../../src/assets/default.png',
  '../../src/assets/firecamp.gif', // https://www.deviantart.com/camilaxiao/art/Warm-Bonfire-Pixel-Art-Animation-856983081
  'stage2.png',
  'stage3.png',
  'stage4.png',
  'stage5.png',
  'stage6.png',
  'stage7.png',
];

const characterStore = useCharacterStore();
const currentCharacter = computed(() => characterStore.getActiveCharacter());

const badgeImage = computed(() => `${badgeStages[currentCharacter.value?.era ?? 0]}`);
</script>
