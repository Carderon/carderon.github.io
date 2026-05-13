<template>
  <div class="relative w-full h-screen">
    <!-- Composant pour le fond d'écran et les animations -->
    <Cinematics />

    <div class="relative grid grid-cols-12 w-full min-h-full dark:bg-gray-800 bg-white">
      <!-- Gauche : Ressources et jauges -->
      <aside class="col-span-2 min-h-full border-gray-300 dark:border-gray-600"
        :class="{ 'border-r bg-gray-50 dark:bg-gray-900/40': isGaugesShown || isResourcesShown }">
        <GaugeList />
        <ResourceList />
      </aside>

      <!-- Centre : Activités et feu de camp -->
      <main class="p-6 flex flex-col col-span-8 h-screen">
        <div class="fixed bottom-0 left-0">
          <transition name="fade">
            <span v-if="elapsed >= 1" class="text-black dark:text-white">{{ Math.floor(elapsed) }}</span>
          </transition>
        </div>

        <nav v-if="tabs.length && tabs.length > 1" class="mb-4 flex flex-wrap gap-2 border-b border-gray-400 relative">
          <button v-for="tab in tabs" :key="tab.id" class="px-3 py-1 text-sm transition relative top-[1px]" :class="activeTab === tab.id
            ? 'text-orange-500 border-b border-orange-500'
            : 'text-black hover:text-orange-200 dark:text-white'
            " @click="activeTab = tab.id">
            {{ tab.label }}
          </button>
        </nav>

        <CharacterPanel v-show="activeTab === 'character'" />

        <ActivityList v-show="activeTab === 'activities'" />

        <ImprovementList v-show="activeTab === 'improvements'" />

        <MonumentPanel v-show="activeTab === 'monument'" monumentId="age1.building.house-1" />

        <Badge v-show="isBadgesShown" />
      </main>

      <!-- Droite : Journaux -->
      <aside class="col-span-2 h-screen">
        <LogList />
      </aside>
    </div>

    <EventPanel />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onBeforeUnmount, onMounted, watchEffect, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import ResourceList from '@/components/ResourceList.vue';
import LogList from '@/components/LogList.vue';
import GaugeList from '@/components/GaugeList.vue';
import ImprovementList from '@/components/improvements/ImprovementList.vue';
import ActivityList from '@/components/ActivityList.vue';
import Cinematics from "@/components/Cinematics.vue";
import Badge from "@/components/Badge.vue";
import EventPanel from '@/components/EventPanel.vue';
import MonumentPanel from '@/components/world/MonumentPanel.vue';
import CharacterPanel from '@/components/CharacterPanel.vue';

import { useActivityStore } from '@/stores/activityStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useClockStore } from '@/stores/clockStore';
import { useGameStateStore } from '@/stores/gameStateStore';
import { useImprovementStore } from '@/stores/improvementStore';

const router = useRouter();

const characterStore = useCharacterStore();
const improvementStore = useImprovementStore();
const activityStore = useActivityStore();

// Le ClockEngine est démarré ici (et arrêté à la sortie) pour que le temps
// ne s'écoule que pendant la partie, pas dans le menu.
const clockStore = useClockStore();
const { elapsed } = storeToRefs(clockStore);

// Visibilité de l'UI : pilotée entièrement par les flags du gameStateStore.
// On regroupe les lectures dans un seul objet `ui` (réactif via computed)
// pour garder le template compact.
//
// Convention de nommage : `ui.flag.<thingShown>` (cf. ARCHITECTURE.md).
const gameState = useGameStateStore();
const isBadgesShown = computed(() => gameState.getFlag('ui.flag.badgesShown'));
const isImprovementsShown = computed(() => gameState.getFlag('ui.flag.improvementsShown'));
const isActivityShown = computed(() => gameState.getFlag('ui.flag.activityShown'));
const isMonumentShown = computed(() => gameState.getFlag('ui.flag.monumentShown'));
const isCharacterShown = computed(() => gameState.getFlag('ui.flag.characterShown'));
const isGaugesShown = computed(() => gameState.getFlag('ui.flag.gaugesShown'));
const isResourcesShown = computed(() => gameState.getFlag('ui.flag.resourcesShown'));

type CenterTabId = 'character' | 'activities' | 'improvements' | 'monument'
type TabDef = { id: CenterTabId; label: string }

const tabs = computed<TabDef[]>(() => {
  const list: TabDef[] = []
  if (isActivityShown.value) list.push({ id: 'activities', label: 'Activités' })
  if (isImprovementsShown.value) list.push({ id: 'improvements', label: 'Améliorations' })
  if (isMonumentShown.value) list.push({ id: 'monument', label: 'Monument' })
  if (isCharacterShown.value) list.push({ id: 'character', label: 'Personnage' })
  return list
})

const activeTab = ref<CenterTabId>('improvements')

watchEffect(() => {
  // Keep the active tab valid when the UI unlocks/locks tabs.
  if (tabs.value.some((t) => t.id === activeTab.value)) return
  activeTab.value = tabs.value[0]?.id ?? 'improvements'
})

onBeforeMount(() => {
  if (!characterStore.getActiveCharacter()) {
    router.push({ name: 'home' });
  }
});

onMounted(() => {
  improvementStore.initializeImprovements();
  activityStore.initializeActivities();
  clockStore.start();
});

onBeforeUnmount(() => {
  clockStore.stop();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

@keyframes backgroundTransition {
  0% {
    background-color: #0f172a;
  }

  100% {
    background-color: #ffffff;
  }
}

.bg-transition {
  animation: backgroundTransition 10s forwards;
}
</style>
