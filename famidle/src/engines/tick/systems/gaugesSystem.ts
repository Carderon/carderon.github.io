import type { TickSystem } from '@/types/TickType'

/**
 * Dependencies the gauges system needs.
 * Provided by `clockStore` to keep the system free of direct Pinia imports.
 */
export interface GaugesSystemDeps {
  /** Add `regenRate * dt` to every gauge (called every tick, ~60 Hz). */
  regenGauges: (dt: number) => void
}

/**
 * Tick system that drives gauge regeneration.
 *
 * Smaller than `resourcesSystem`: gauges have no visibility logic and no
 * improvement modifiers (yet), so this is just a thin proxy passing `dt`
 * through. We still expose it as a system (instead of inlining in the store)
 * to keep the engine/store split consistent and let us add modifiers later
 * (e.g. "regen halved at night") without touching `clockStore`.
 */
export function createGaugesSystem(deps: GaugesSystemDeps): TickSystem {
  return {
    id: 'gauges',

    onTick(ctx) {
      deps.regenGauges(ctx.deltaTime)
    },
  }
}
