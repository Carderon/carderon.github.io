import type { TickContext, TickSystem } from '@/types/TickType'

export interface ClockEngineParams {
  // maximum dt in seconds to avoid huge jumps in the simulation
  // huge jumps could append when the tab is backgrounded (or the machine sleeps)
  maxDeltaTime?: {
    isEnabled: boolean
    maxSeconds: number
  }
}

/**
 * Central clock of the game.
 *
 * What it does:
 * - runs a loop via `requestAnimationFrame`
 * - computes `dt` (delta time in seconds)
 * - calls every registered `TickSystem` with `{ dt, elapsed, tick }`
 *
 * What it does NOT do:
 * - it does not contain game rules (no resources, no gauges, no events logic)
 * - it only orchestrates time passing
 *
 * Typical usage (later, from a store or app bootstrap):
 *
 * ```ts
 * const clock = new ClockEngine({ clampDt: { enabled: true, maxSeconds: 0.25 } })
 * clock.register(resourcesSystem)
 * clock.register(gaugesSystem)
 * clock.start()
 * ```
 */
export class ClockEngine {
  private systems: TickSystem[] = []
  private running = false
  private paused = false
  /** Multiplier applied to deltaTime (2 = twice as fast). */
  private speed = 1

  /**
   * `requestAnimationFrame` timestamp of the previous frame.
   * Used to compute deltaTime = (ts - lastTsMs) / 1000.
   */
  private lastTsMs: number | null = null
  private rafId: number | null = null

  /** Number of ticks processed since start (not "seconds"). AKA total rounds passed*/
  private tick = 0
  /** Elapsed simulation time in seconds (deltaTime accumulated). */
  private elapsed = 0

  constructor(private options: ClockEngineParams = {}) {}

  /**
   * Register a system. Order matters: systems are called in registration order.
   * Should be only one, but we can register many if wanted
   */
  register(system: TickSystem) {
    if (this.systems.some((s) => s.id === system.id)) {
      throw new Error(`[clock] duplicate system id: ${system.id}`)
    }
    this.systems.push(system)
  }

  /**
   * Change the simulation speed.
   * Example: `2` means "twice as fast", `0.5` means "half speed".
   */
  setSpeed(speed: number) {
    if (!Number.isFinite(speed) || speed <= 0) throw new Error('[clock] speed must be > 0')
    this.speed = speed
  }

  /**
   * Start the clock:
   * - resets counters
   * - calls `onStart` hooks
   * - begins the requestAnimationFrame loop
   */
  start() {
    if (this.running) return
    this.running = true
    this.paused = false
    this.lastTsMs = null
    this.tick = 0
    this.elapsed = 0

    this.systems.forEach((system) => system.onStart?.())
    this.loop()
  }

  /**
   * Stop the clock:
   * - cancels requestAnimationFrame
   * - calls `onStop` hooks
   */
  stop() {
    if (!this.running) return
    this.running = false
    this.paused = false
    this.lastTsMs = null
    if (this.rafId != null) cancelAnimationFrame(this.rafId)
    this.rafId = null
    this.systems.forEach((system) => system.onStop?.())
  }

  /** Pause ticking (the RAF loop continues, but `onTick` is not called). */
  pause() {
    this.paused = true
  }

  /**
   * Resume ticking.
   * We reset `lastTsMs` to avoid a giant dt spanning the paused time.
   */
  resume() {
    if (!this.running) return
    this.paused = false
    this.lastTsMs = null
  }

  private loop = () => {
    if (!this.running) return

    // raf = requestAnimationFrame
    this.rafId = requestAnimationFrame((ts) => {
      if (!this.running) return

      if (this.paused) {
        // Keep last timestamp updated while paused, so resume doesn't create a giant dt.
        this.lastTsMs = ts
        this.loop()
        return
      }

      let deltaTime = 0
      if (this.lastTsMs != null) {
        deltaTime = ((ts - this.lastTsMs) / 1000) * this.speed
      }
      this.lastTsMs = ts

      const clamp = this.options.maxDeltaTime
      if (clamp?.isEnabled) deltaTime = Math.min(deltaTime, clamp.maxSeconds)

      // Skip first frame where deltaTime = 0 (no previous timestamp yet).
      if (deltaTime > 0) {
        this.tick += 1
        this.elapsed += deltaTime
        const ctx: TickContext = { deltaTime, elapsed: this.elapsed, tick: this.tick }
        this.systems.forEach((system) => system.onTick(ctx))
      }

      this.loop()
    })
  }
}
