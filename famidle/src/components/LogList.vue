<template>
  <transition name="fade">
    <div v-show="isLogsShown" class="relative p-6 h-full flex-1">
      <div
        class="absolute top-0 left-0 h-full w-full bg-gradient-to-b pointer-events-none from-transparent to-white dark:to-gray-800 from-0% to-70%">

      </div>
      <h2 class="text-xl font-bold hidden">Logs</h2>
      <ul class="dark:text-white text-black flex flex-col gap-6">
        <li v-for="(log, index) in displayedLogs" :key="logs.length - 1 - index">
          {{ log }}
        </li>
      </ul>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useLogStore } from '@/stores/logStore';
import { storeToRefs } from 'pinia';
import { useGameStateStore } from '@/stores/gameStateStore';
import { computed } from 'vue';

const gameState = useGameStateStore();
const isLogsShown = computed(() => gameState.getFlag('ui.flag.logsShown'));

const logStore = useLogStore();
const { logs } = storeToRefs(logStore);

const displayedLogs = computed(() => logs.value.slice().reverse());
</script>
