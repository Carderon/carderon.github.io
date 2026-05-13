/**
 * World types: buildings, rooms, tiles.
 *
 * The world is the "physical" side of the game (vs events / resources / gauges).
 * Hierarchy:
 *   Building  →  Room[]  →  Tile[][] (2D grid)
 *
 * Each tile has a state machine (broken → dirty → ready) and an asset per state.
 * Repairing a tile is what links the world to the rest of the simulation:
 * it costs resources and increments a counter that events can watch.
 */

import type { ResourceCostBag } from '@/types/ResourceType'

export type TileState = 'broken' | 'ready'

/**
 * Cost paid (in resources) to perform an action on a tile (e.g. repair).
 * Aliased on `ResourceCostBag` so every "spending" surface of the game
 * speaks the same shape.
 */
export type TileCost = ResourceCostBag

export interface Tile {
  /** Stable unique id, e.g. `age1.tile.bedroom.5`. */
  id: string
  /** Libellé pour tooltip / futurs textes (ex. nom de la zone réparée). */
  displayName?: string
  state: TileState
  /** Asset URL per state (placeholder data: URLs in dev are fine). */
  backgrounds: Record<TileState, string>
  /** Cost to repair this tile (slug → quantity). Empty = free. */
  repairCost?: TileCost
  /** Durée de « construction » en temps sim (s). Défaut côté store si absent. */
  repairDurationSeconds?: number
}

export interface Room {
  id: string
  name: string
  /** 2D grid of tiles. Outer = rows, inner = columns. */
  tiles: Tile[][]
}

export interface Building {
  id: string
  name: string
  rooms: Room[]
}
