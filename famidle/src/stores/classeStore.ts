// src/stores/logStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useClassStore = defineStore('class', () => {
  const classes = ref([
    { name: 'Guerrier', slug: 'warrior', specializations: ['a', 'b', 'c'] },
    { name: 'Mage', slug: 'mage', specializations: ['a', 'b', 'c'] },
    { name: 'Voleur', slug: 'thief', specializations: ['a', 'b', 'c'] },
  ]);

  return {
    classes,
  };
});
