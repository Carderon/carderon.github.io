<template>
  <div class="flex flex-col w-full h-screen pt-48 items-center bg-white dark:bg-gray-800">
    <h1 class="text-4xl font-black mb-8 text-black dark:text-white">Fame Idle - Game</h1>
    <ul class="flex flex-col gap-2 items-center w-[175px]">
      <li class="w-full">
        <button
          class="bg-neutral-600 border border-gray-400 rounded-xl px-2 py-1 disabled:opacity-50 text-white w-full hover:bg-neutral-400 transition-all duration-200"
          @click="handleStartGame">Nouvelle partie</button>
      </li>
      <li class="w-full">
        <button :disabled="!save"
          class="bg-neutral-600 border border-gray-400 rounded-xl px-2 py-1 disabled:opacity-50 text-white w-full hover:bg-neutral-400 transition-all duration-200">Charger
          une partie</button>
      </li>
    </ul>
  </div>

  <div class="fixed flex-col bg-black/75 top-0 left-0 w-full h-full flex justify-center items-center" v-if="isVisible">
    <div class="h-1/3 w-1/3 bg-white p-10 dark:bg-gray-800">
      <h2 class="text-2xl font-bold mb-4 text-black dark:text-white">Nouvelle partie !</h2>
      <p class="mb-2 text-black dark:text-white">Choisissez une classe</p>
      <div class="flex flex-col gap-4">
        <button
          class="bg-neutral-600 border border-gray-400 rounded-xl px-2 py-1 disabled:opacity-50 text-white w-full hover:bg-neutral-400 transition-all duration-200"
          @click="handleSelectClass('warrior')">Guerrier</button>
        <button
          class="bg-neutral-600 border border-gray-400 rounded-xl px-2 py-1 disabled:opacity-50 text-white w-full hover:bg-neutral-400 transition-all duration-200"
          @click="handleSelectClass('mage')" disabled>Mage</button>
        <button
          class="bg-neutral-600 border border-gray-400 rounded-xl px-2 py-1 disabled:opacity-50 text-white w-full hover:bg-neutral-400 transition-all duration-200"
          @click="handleSelectClass('thief')" disabled>Voleur</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore.ts'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

const save = localStorage.getItem('fameIdleSave');

const isVisible = ref(false);

const characterStore = useCharacterStore();
const { activeCharacterIndex } = storeToRefs(characterStore)

const router = useRouter();
const handleSelectClass = (selectedClass: string) => {
  characterStore.addCharacter(selectedClass);
  activeCharacterIndex.value = 0;

  router.push({ 'name': 'game' })
}

const handleStartGame = () => {
  isVisible.value = true;
}
</script>
