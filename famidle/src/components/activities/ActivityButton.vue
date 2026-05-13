<template>
  <div class="relative group inline-block">
    <button type="button"
      class="relative max-h-[32px] overflow-hidden rounded-xl border border-gray-400 bg-neutral-600 px-2 py-1 text-white transition-all duration-100 hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-neutral-600"
      :disabled="!canRun" @click="handleClick">
      <span class="relative z-10 block text-white">{{ activity.name }}</span>
      <!-- Cooldown : barre qui se vide, ancrée à droite (miroir du build d'amélioration). -->
      <span v-show="cooldownRemainingFrac > 0"
        class="pointer-events-none absolute top-0 right-0 z-[5] h-full bg-white/45 transition-[width] duration-100"
        :style="{ width: cooldownRemainingFrac * 100 + '%' }" />
    </button>

    <GameTooltip placement="below">
      <p class="text-sm font-semibold">{{ activity.name }}</p>
      <p v-if="activity.flavourText" class="mt-1 text-[11px] italic opacity-90">
        {{ activity.flavourText }}
      </p>
      <p class="mt-2 text-[11px] opacity-95">Cooldown : {{ activity.cooldownSeconds }}s</p>
      <p v-if="hasResourceCost" class="mt-1 text-[11px] opacity-95">Coût : {{ formattedResourceCost }}</p>
      <p v-if="hasGaugeCost" class="mt-1 text-[11px] opacity-95">Coût jauges : {{ formattedGaugeCost }}</p>
      <p v-if="formattedConditions" class="mt-1 text-[11px] opacity-80">
        Conditions : {{ formattedConditions }}
      </p>
      <p v-if="formattedGains" class="mt-1 text-[11px] opacity-95">Gain : {{ formattedGains }}</p>
    </GameTooltip>
  </div>
</template>

<script lang="ts" setup>
import GameTooltip from '@/components/ui/GameTooltip.vue'
import { useActivityStore } from '@/stores/activityStore'
import { useClockStore } from '@/stores/clockStore'
import { useImprovementStore } from '@/stores/improvementStore'
import { useGaugeStore } from '@/stores/gaugeStore'
import { useResourceStore } from '@/stores/resourceStore'
import type { ActivityConditionType, ActivityEffectType, ActivityType } from '@/types/ActivityType'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'ActivityButton' })

const props = defineProps<{ activity: ActivityType }>()

const activityStore = useActivityStore()
const improvementStore = useImprovementStore()
const resourceStore = useResourceStore()
const gaugeStore = useGaugeStore()
const clockStore = useClockStore()
const { tick } = storeToRefs(clockStore)

const canRun = computed(() => {
  void tick.value
  return activityStore.canPerformActivity(props.activity.slug)
})

/** Fraction de cooldown restante (1 → 0), temps sim (pause / vitesse = moteur). */
const cooldownRemainingFrac = computed(() => {
  void tick.value
  const remaining = activityStore.getCooldownRemainingSimSeconds(props.activity.slug)
  if (remaining <= 0 || props.activity.cooldownSeconds <= 0) return 0
  return Math.min(1, Math.max(0, remaining / props.activity.cooldownSeconds))
})

const hasResourceCost = computed(() => {
  const c = props.activity.costs
  return !!c?.some(({ quantity }) => quantity > 0)
})

const hasGaugeCost = computed(() => {
  const c = props.activity.gaugeCosts
  return !!c?.some(({ quantity }) => quantity > 0)
})

const formattedResourceCost = computed(() => {
  const costs = props.activity.costs
  if (!costs) return ''
  return costs
    .filter(({ quantity }) => quantity > 0)
    .map(
      ({ resourceSlug, quantity }) =>
        `${quantity} ${resourceStore.getResource(resourceSlug)?.name ?? resourceSlug}`,
    )
    .join(', ')
})

const gaugeLabels: Record<string, string> = {
  health: 'vitalité',
  stamina: 'endurance',
}

const formattedGaugeCost = computed(() => {
  const costs = props.activity.gaugeCosts
  if (!costs) return ''
  return costs
    .filter(({ quantity }) => quantity > 0)
    .map(
      ({ gaugeSlug, quantity }) =>
        `${quantity} ${gaugeLabels[gaugeSlug] ?? gaugeSlug}`,
    )
    .join(', ')
})

/** Conditions lisibles (hors flags — réservés au gameState / plus tard). */
function formatConditions(conditions: ActivityConditionType | undefined): string {
  if (!conditions) return ''
  const parts: string[] = []
  if (conditions.requiredClass) parts.push(`classe : ${conditions.requiredClass}`)
  if (conditions.requiredSpecialization)
    parts.push(`spécialisation : ${conditions.requiredSpecialization}`)
  if (conditions.minLevel != null) parts.push(`niveau ≥ ${conditions.minLevel}`)
  if (conditions.minResourceQuantity) {
    for (const [slug, qty] of Object.entries(conditions.minResourceQuantity)) {
      const label = resourceStore.getResource(slug)?.name ?? slug
      parts.push(`${qty} ${label}`)
    }
  }
  if (conditions.requiredImprovement)
    parts.push(
      improvementStore.getImprovement(conditions.requiredImprovement)?.name ??
        conditions.requiredImprovement,
    )
  return parts.join(' · ')
}

function formatGainEffect(effect: ActivityEffectType): string {
  if (effect.kind === 'addResource' && effect.amount > 0) {
    const label = resourceStore.getResource(effect.resourceSlug)?.name ?? effect.resourceSlug
    return `+${effect.amount} ${label}`
  }
  if (effect.kind === 'addGauge' && effect.amount > 0) {
    const gauge = gaugeStore.gauges.find((g) => g.slug === effect.gaugeSlug)
    const label = gauge?.name ?? effect.gaugeSlug
    const max = gauge?.max ?? 0
    const fillsToFull = max > 0 && effect.amount >= max
    return fillsToFull ? `${label} : plein` : `+${effect.amount} ${label}`
  }
  return ''
}

const formattedConditions = computed(() => formatConditions(props.activity.conditions))

/** Uniquement gains directs (ressources / jauges), avec noms affichables. */
const formattedGains = computed(() =>
  (props.activity.effects ?? []).map(formatGainEffect).filter((s) => s !== '').join(' · '),
)

function handleClick() {
  activityStore.performActivity(props.activity.slug)
}
</script>
