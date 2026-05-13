// src/stores/logStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLogStore = defineStore('log', () => {
  const logs = ref<string[]>([]);

  const addLog = (message: string) => {
    logs.value.push(`${message}`);
    // Limite le nombre de logs affichés à 100 pour éviter la surcharge
    if (logs.value.length > 100) {
      logs.value.shift();
    }
  };

  const initializeLogs = () => {
    return [];
  };

  return {
    logs,
    addLog,
    initializeLogs
  };
});
