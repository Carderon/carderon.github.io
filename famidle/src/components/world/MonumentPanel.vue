<template>
  <section v-if="building" class="h-full">
    <header class="mb-4 flex items-baseline justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-gray-500">Monument</p>
        <h2 class="text-3xl font-bold text-black dark:text-white">{{ building.name }}</h2>
      </div>
      <div class="text-right text-xs uppercase tracking-wider text-gray-500">
        <div>{{ activeRoom?.name ?? '—' }}</div>
        <div v-if="buildingProgress != null">{{ buildingProgress }}%</div>
      </div>
    </header>

    <nav v-if="building.rooms.length > 1" class="mb-4 flex flex-wrap gap-2">
      <button v-for="room in building.rooms" :key="room.id"
        class="rounded-lg border border-gray-400 px-3 py-1 text-sm transition" :class="room.id === activeRoomId
          ? 'bg-neutral-800 text-white'
          : 'bg-white text-black hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800'
          " @click="activeRoomId = room.id">
        {{ room.name }}
      </button>
    </nav>

    <Bedroom v-if="activeRoom" :building-id="monumentId" :room-id="activeRoom.id" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorldStore } from '@/stores/worldStore'
import Bedroom from '@/views/age1/Bedroom.vue'

defineOptions({ name: 'MonumentPanel' })

const props = defineProps<{ monumentId: string }>()

const worldStore = useWorldStore()
const building = computed(() => worldStore.getBuilding(props.monumentId))

const activeRoomId = ref<string | null>(null)
const activeRoom = computed(() => {
  const b = building.value
  if (!b) return null
  const wanted = activeRoomId.value ?? b.rooms[0]?.id
  return b.rooms.find((r) => r.id === wanted) ?? b.rooms[0] ?? null
})

const buildingProgress = computed(() => {
  const b = building.value
  if (!b) return null
  const tiles = b.rooms.flatMap((r) => r.tiles.flat())
  if (!tiles.length) return 0
  const repaired = tiles.filter((t) => t.state === 'ready').length
  return Math.round((repaired / tiles.length) * 100)
})
</script>
