import type { Building, Tile, TileCost, TileState } from '@/types/WorldType'

/**
 * Age 1 starter building: a half-broken house with a single bedroom.
 *
 * Images optionnelles : `src/assets/tiles/bedroom/tile-NN-broken|ready.{png,webp,...}`
 * (voir README du dossier). Sinon placeholders SVG.
 */

const bedroomBrokenTileAssets = import.meta.glob(
  '../../../assets/buildings/age1/bedroom/broken/**/*',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
) as Record<string, string>

const bedroomReadyTileAssets = import.meta.glob(
  '../../../assets/buildings/age1/bedroom/ready/**/*',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
) as Record<string, string>

const TILE_LABELS = [
  'Sol — coin nord-ouest',
  'Sol — nord',
  'Sol — nord-est',
  'Sol — ouest',
  'Centre (lit)',
  'Sol — est',
  'Sol — sud-ouest',
  'Sol — sud',
  'Sol — sud-est',
]

function placeholderBackground(state: TileState, tileIndex: number): string {
  const palette: Record<TileState, { fill: string; label: string }> = {
    broken: { fill: '#4a3728', label: '✗' },
    ready: {
      fill: `hsl(${28 + ((tileIndex * 31) % 300)}, 42%, 38%)`,
      label: '✓',
    },
  }
  const { fill, label } = palette[state]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='${fill}'/><text x='50' y='58' font-size='36' text-anchor='middle' fill='white' font-family='system-ui,sans-serif'>${label}</text><text x='50' y='88' font-size='14' text-anchor='middle' fill='rgba(255,255,255,0.75)' font-family='system-ui,sans-serif'>${tileIndex + 1}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function tileBackgrounds(tileNumber: number, tileIndex: number): Record<TileState, string> {
  const id = String(tileNumber).padStart(2, '0')
  const broken =
    bedroomBrokenTileAssets[`../../../assets/buildings/age1/bedroom/broken/tile-${id}.png`] ??
    placeholderBackground('broken', tileIndex)
  const ready =
    bedroomReadyTileAssets[`../../../assets/buildings/age1/bedroom/ready/tile-${id}.png`] ??
    placeholderBackground('ready', tileIndex)
  return { broken, ready }
}

function makeTile(
  id: string,
  tileNumber: number,
  tileIndex: number,
  repairCost: TileCost = [],
): Tile {
  return {
    id,
    displayName: TILE_LABELS[tileIndex] ?? `Tuile ${tileIndex + 1}`,
    state: 'broken',
    backgrounds: tileBackgrounds(tileNumber, tileIndex),
    repairCost,
    repairDurationSeconds: 6,
  }
}

/**
 * Factory : une session = une maison neuve (tuiles mutables).
 */
export function createHouse(): Building {
  const buildingId = 'age1.building.house-1'
  const roomId = 'age1.room.bedroom'
  const rows = 3
  const cols = 3

  const baseCost: TileCost = [
    { resourceSlug: 'age1.resource.wood', quantity: 10 },
    { resourceSlug: 'age1.resource.stone', quantity: 10 },
    { resourceSlug: 'age1.resource.cloth', quantity: 10 },
  ]

  const centerCost: TileCost = [
    { resourceSlug: 'age1.resource.wood', quantity: 20 },
    { resourceSlug: 'age1.resource.stone', quantity: 20 },
    { resourceSlug: 'age1.resource.cloth', quantity: 20 },
  ]

  const tiles: Tile[][] = []
  for (let y = 0; y < rows; y++) {
    const row: Tile[] = []
    for (let x = 0; x < cols; x++) {
      const index = y * cols + x
      const tileNumber = index + 1
      const tileId = `age1.tile.bedroom.${tileNumber}`
      const repairCost = index === 4 ? centerCost : baseCost
      row.push(makeTile(tileId, tileNumber, index, repairCost))
    }
    tiles.push(row)
  }

  return {
    id: buildingId,
    name: 'Maison',
    rooms: [
      {
        id: roomId,
        name: 'Chambre',
        tiles,
      },
    ],
  }
}
