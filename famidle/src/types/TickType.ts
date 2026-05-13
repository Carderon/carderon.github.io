/**
 * Tick types used by the simulation clock.
 *
 * These types are intentionally small and generic:
 * - the clock knows only "time passing"
 * - the game logic lives in systems that react to ticks
 */

export interface TickContext {
  /** Delta time in seconds (already multiplied by clock speed). */
  deltaTime: number
  /** Total elapsed time since `clock.start()`, in seconds. */
  elapsed: number
  /** Incrementing tick counter since `clock.start()`. */
  tick: number
}

/**
 * A "system" is a small module that reacts to time passing.
 *
 * Examples (later):
 * - resources system: produces resources over time
 * - gauges system: regenerates stamina/health
 * - events system: checks eligibility and enqueues events
 */
export interface TickSystem {
  /** Unique id to avoid registering the same system twice. */
  id: string
  /** Called on every tick with dt + counters. */
  onTick(ctx: TickContext): void
  /** Optional lifecycle hook called once on `clock.start()`. */
  onStart?(): void
  /** Optional lifecycle hook called once on `clock.stop()`. */
  onStop?(): void
}
