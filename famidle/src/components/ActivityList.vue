<template>
  <div class="flex-1 space-y-4">
    <h2 class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
      Activités
    </h2>
    <p class="text-sm text-gray-600 dark:text-gray-300">
      Actions du quotidien : récolter, fouiller, se reposer.
    </p>
    <ul class="flex flex-col items-start gap-3">
      <template v-for="activity in activities" :key="activity.slug">
        <li v-if="activity.isVisible">
          <ActivityButton :activity="activity" />
        </li>
      </template>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import ActivityButton from '@/components/activities/ActivityButton.vue'
import { useActivityStore } from '@/stores/activityStore'
import { storeToRefs } from 'pinia'

const activityStore = useActivityStore()
const { activities } = storeToRefs(activityStore)
</script>
