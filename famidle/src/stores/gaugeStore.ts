import { globalGauges } from '@/data/gauges/global'
import type { GaugeType } from '@/types/GaugeType'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGaugeStore = defineStore('gauge', () => {
  const gauges = ref<GaugeType[]>([...globalGauges])
  // Recalcule `finalRegenRate` (base + bonus d'improvements quand on en aura).
  // À appeler quand un improvement est acheté/changé, pas à chaque frame.
  const getGaugeRates = () => {
    gauges.value.forEach((gauge) => {
      const improvementEffect = 0
      gauge.finalRegenRate = gauge.regenRate + improvementEffect
    })
  }

  const getGaugeQuantity = (gaugeSlug: string): number => {
    return gauges.value.find((g) => g.slug === gaugeSlug)?.current ?? 0
  }

  /**
   * Ajoute (ou retire si négatif) une quantité à une jauge, bornée à `[0, max]`.
   */
  const updateGauge = (gaugeSlug: string, amount: number) => {
    const gauge = gauges.value.find((g) => g.slug === gaugeSlug)
    if (!gauge) return
    gauge.current = Math.max(0, Math.min(gauge.current + amount, gauge.max))
  }

  /** Crédite une jauge (montant positif uniquement), utile pour effets / événements. */
  const addGauge = (gaugeSlug: string, amount: number) => {
    if (amount <= 0) return
    updateGauge(gaugeSlug, amount)
  }

  /** Débite une jauge si le solde suffit ; sinon ne modifie rien. */
  const trySpendGauge = (gaugeSlug: string, quantity: number): boolean => {
    if (quantity <= 0) return true
    const gauge = gauges.value.find((g) => g.slug === gaugeSlug)
    if (!gauge || gauge.current < quantity) return false
    gauge.current -= quantity
    return true
  }

  /**
   * Régénération des jauges sur un intervalle `dt` (en secondes).
   *
   * Appelé à chaque tick du `ClockEngine` via `gaugesSystem`.
   * Volontairement minimal et idempotent (safe à ~60 Hz).
   */
  const regenGauges = (dt: number) => {
    if (dt <= 0) return
    gauges.value.forEach((gauge) => {
      const amountToRegen = gauge.finalRegenRate * dt
      if (amountToRegen !== 0) {
        updateGauge(gauge.slug, amountToRegen)
      }
    })
  }

  const initializeGauges = () => {
    //
  }

  const getGaugeMax = (gaugeSlug: string): number => {
    return gauges.value.find((g) => g.slug === gaugeSlug)?.max ?? 0
  }

  return {
    gauges,
    getGaugeRates,
    getGaugeQuantity,
    updateGauge,
    addGauge,
    trySpendGauge,
    getGaugeMax,
    regenGauges,
    initializeGauges,
  }
})
