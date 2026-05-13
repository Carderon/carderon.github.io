<template>
  <div class="relative group inline-block">
    <button
      class="relative bg-neutral-600 border border-gray-400 rounded-xl px-2 py-1 text-white transition-all duration-20 overflow-hidden hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-neutral-600 max-h-[32px]"
      :disabled="isBuilding || !canBuy" @click="handleBuyImprovement(improvement.slug)">
      <span class="z-10 text-white relative block">{{ improvement.name }}</span>
      <span v-show="isBuilding" :style="{ width: 100 - buildProgress + '%' }"
        class="absolute top-0 left-0 h-full bg-white opacity-50 transition-all block duration-100"></span>
    </button>

    <GameTooltip placement="below">
      <p class="text-sm font-semibold">{{ improvement.name }}</p>
      <p v-if="improvement.flavourText" class="mt-1 text-[11px] italic opacity-90">
        {{ improvement.flavourText }}
      </p>
      <p class="mt-2 text-[11px] opacity-95">Temps : {{ improvement.buildTime }}s</p>
      <p v-if="hasCost" class="mt-1 text-[11px] opacity-95">Coût : {{ formattedCost }}</p>
      <p v-if="formattedConditions" class="mt-1 text-[11px] opacity-80">
        Conditions : {{ formattedConditions }}
      </p>
      <p v-if="formattedEffects" class="mt-1 text-[11px] opacity-80">Effets : {{ formattedEffects }}</p>
    </GameTooltip>
  </div>
</template>

<script lang="ts" setup>
import GameTooltip from '@/components/ui/GameTooltip.vue'
import { useImprovementStore } from '@/stores/improvementStore.ts'
import type {
  ImprovementConditionType,
  ImprovementEffectType,
  ImprovementType,
} from '@/types/ImprovementType'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useClockStore } from '@/stores/clockStore'
import { useResourceStore } from '@/stores/resourceStore'

defineOptions({ name: 'ImprovementButton' })

const improvementStore = useImprovementStore()
const resourceStore = useResourceStore()
const clockStore = useClockStore()
const { tick } = storeToRefs(clockStore)

const props = defineProps<{ improvement: ImprovementType }>()

const isBuilding = computed(() => {
  void tick.value
  return improvementStore.isPendingBuild(props.improvement.slug)
})

const buildProgress = computed(() => {
  void tick.value
  return improvementStore.getBuildProgress01(props.improvement.slug, props.improvement.buildTime) * 100
})

// `canBuyImprovement` reads reactive stores so this computed re-evaluates
// whenever the player's resources or other gating state change.
const canBuy = computed(() => improvementStore.canBuyImprovement(props.improvement.slug))

const hasCost = computed(() => {
  const costs = props.improvement.costs
  if (!costs) return false
  return costs.some(({ quantity }: { quantity: number }) => quantity > 0)
})

const formattedCost = computed(() => {
  const costs = props.improvement.costs
  if (!costs) return ''
  return costs
    .filter(({ quantity }: { quantity: number }) => quantity > 0)
    .map(
      ({ resourceSlug, quantity }: { resourceSlug: string, quantity: number }) =>
        `${quantity} ${resourceStore.getResource(resourceSlug)?.name ?? resourceSlug}`,
    )
    .join(', ')
})

function formatConditions(conditions: ImprovementConditionType | undefined): string {
  if (!conditions) return ''
  const parts: string[] = []
  if (conditions.requiredClass) parts.push(`classe = ${conditions.requiredClass}`)
  if (conditions.requiredSpecialization)
    parts.push(`spécialisation = ${conditions.requiredSpecialization}`)
  if (conditions.minLevel != null) parts.push(`niveau ≥ ${conditions.minLevel}`)
  if (conditions.minResourceQuantity) {
    for (const [slug, qty] of Object.entries(conditions.minResourceQuantity)) {
      parts.push(`avoir ${qty} ${slug}`)
    }
  }
  if (conditions.requiredImprovement) parts.push(`après ${improvementStore.getImprovement(conditions.requiredImprovement)?.name ?? conditions.requiredImprovement}`)
  return parts.join(', ')
}

function formatEffect(effect: ImprovementEffectType): string {
  switch (effect.kind) {
    case 'resourceRate':
      return `${effect.amount >= 0 ? '+' : ''}${effect.amount} ${effect.resourceSlug}/s`
    case 'gaugeRate':
      return `${effect.amount >= 0 ? '+' : ''}${effect.amount} ${effect.gaugeSlug}/s`
    case 'incrementCounter':
      return `${effect.counter} +${effect.by ?? 1}`
    case 'addResource':
      return `+${effect.amount} ${effect.resourceSlug}`
    default:
      return ''
  }
}

const formattedConditions = computed(() => formatConditions(props.improvement.conditions))
const formattedEffects = computed(() =>
  (props.improvement.effects ?? []).map(formatEffect).filter((effect) => effect !== '').join(', '),
)

const handleBuyImprovement = (slug: string) => {
  if (isBuilding.value || !canBuy.value) return
  improvementStore.scheduleBuild(slug)
}
</script>
