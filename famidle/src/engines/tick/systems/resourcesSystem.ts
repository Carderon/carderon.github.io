import type { TickSystem } from '@/types/TickType'

/**
 * Dependencies the resources system needs.
 * Provided by `clockStore` to keep the system free of direct Pinia imports.
 */
export interface ResourcesSystemDeps {
  /** Add `rate * dt` to every resource (called every tick, ~60 Hz). */
  produceResources: (dt: number) => void
  /** Recompute resource & improvement visibility (called ~1 Hz, see notes). */
  recomputeVisibility: () => void
}

/**
 * Tick system that drives resource production.
 *
 * On every tick:
 * 1. add `rate * dt` to every resource (cheap, runs at ~60 Hz)
 * 2. once per simulated second, recompute visibility (resources + improvements)
 *
 * Why split production from visibility?
 * - production is a tiny per-frame add → fine at 60 Hz
 * - visibility recomputes the whole resource array + walks improvements →
 *   wasteful at 60 Hz, irrelevant before the next second has elapsed anyway
 *
 * Note on throttling: we use `Math.floor(ctx.elapsed)` as the "second tick"
 * because `ctx.elapsed` already accounts for `clock.setSpeed`. So if the
 * clock runs at 2x, visibility refreshes twice as fast — which is what you
 * want for a sped-up simulation.
 */
export function createResourcesSystem(deps: ResourcesSystemDeps): TickSystem {
  let lastVisibilitySecond = -1

  return {
    id: 'resources',

    onStart() {
      lastVisibilitySecond = -1
    },

    onTick(ctx) {
      deps.produceResources(ctx.deltaTime)

      const currentSecond = Math.floor(ctx.elapsed)
      if (currentSecond !== lastVisibilitySecond) {
        lastVisibilitySecond = currentSecond
        deps.recomputeVisibility()
      }
    },
  }
}
