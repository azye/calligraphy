import Konva from 'konva'

const BUFFER = 20 // min margin buffer size
const CELL_SIZE = 75
const DEFAULT_GRID_LINE = {
  dash: [1, 1],
  stroke: 'black',
  strokeWidth: 1,
}

const renderGridBorder = (layer: Konva.Layer) => {
  const gridCols = Math.floor((layer.hitCanvas.width - BUFFER * 2) / 75)
  const gridRows = Math.floor((layer.hitCanvas.height - BUFFER * 2) / 75)
  const startX = (layer.hitCanvas.width - gridCols * CELL_SIZE) / 2
  const startY = (layer.hitCanvas.height - gridRows * CELL_SIZE) / 2

  const poly = new Konva.Line({
    points: [
      startX,
      startY,
      layer.hitCanvas.width - startX,
      startY,
      layer.hitCanvas.width - startX,
      layer.hitCanvas.height - startY,
      startX,
      layer.hitCanvas.height - startY,
      startX,
      startY,
    ],
    stroke: 'black',
    strokeWidth: 3,
    closed: true,
  })
  layer.add(poly)
}

const renderBasicGrid = (layer: Konva.Layer) => {
  const gridCols = Math.floor((layer.hitCanvas.width - BUFFER * 2) / 75)
  const gridRows = Math.floor((layer.hitCanvas.height - BUFFER * 2) / 75)

  const startX = (layer.hitCanvas.width - gridCols * CELL_SIZE) / 2
  const startY = (layer.hitCanvas.height - gridRows * CELL_SIZE) / 2

  for (let i = 1; i < gridCols; i++) {
    const p = new Konva.Line({
      points: [startX + i * CELL_SIZE, startY, startX + i * CELL_SIZE, layer.hitCanvas.height - startY],
      stroke: 'black',
      strokeWidth: 2,
    })

    layer.add(p)
  }

  for (let i = 1; i < gridRows; i++) {
    const p = new Konva.Line({
      points: [startX, startY + i * CELL_SIZE, layer.hitCanvas.width - startX, startY + i * CELL_SIZE],
      stroke: 'black',
      strokeWidth: 2,
    })

    layer.add(p)
  }
}
const renderPlusGrid = (layer: Konva.Layer) => {
  const gridCols = Math.floor((layer.hitCanvas.width - BUFFER * 2) / 75)
  const gridRows = Math.floor((layer.hitCanvas.height - BUFFER * 2) / 75)

  const startX = (layer.hitCanvas.width - gridCols * CELL_SIZE) / 2
  const startY = (layer.hitCanvas.height - gridRows * CELL_SIZE) / 2

  for (let i = 0; i < gridRows; i++) {
    const p = new Konva.Line({
      points: [
        startX,
        startY + i * CELL_SIZE + CELL_SIZE / 2,
        layer.hitCanvas.width - startX,
        startY + i * CELL_SIZE + CELL_SIZE / 2,
      ],
      ...DEFAULT_GRID_LINE,
    })
    layer.add(p)
  }

  for (let i = 0; i < gridCols; i++) {
    const p = new Konva.Line({
      points: [
        startX + i * CELL_SIZE + CELL_SIZE / 2,
        startY,
        startX + i * CELL_SIZE + CELL_SIZE / 2,
        layer.hitCanvas.height - startY,
      ],
      ...DEFAULT_GRID_LINE,
    })
    layer.add(p)
  }
}

const renderCrossGrid = (layer: Konva.Layer) => {
  const gridCols = Math.floor((layer.hitCanvas.width - BUFFER * 2) / 75)
  const gridRows = Math.floor((layer.hitCanvas.height - BUFFER * 2) / 75)
  const startX = (layer.hitCanvas.width - gridCols * CELL_SIZE) / 2
  const startY = (layer.hitCanvas.height - gridRows * CELL_SIZE) / 2
  const group = new Konva.Group()

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const x1 = startX + col * CELL_SIZE
      const y1 = startY + row * CELL_SIZE
      const x2 = x1 + CELL_SIZE
      const y2 = y1 + CELL_SIZE

      group.add(new Konva.Line({ points: [x1, y1, x2, y2], ...DEFAULT_GRID_LINE }))
      group.add(new Konva.Line({ points: [x1, y2, x2, y1], ...DEFAULT_GRID_LINE }))
    }
  }
  layer.add(group)
}

export const renderGrid = (layer: Konva.Layer) => {
  renderGridBorder(layer)
  renderBasicGrid(layer)
}

export const renderRiceGrid = (layer: Konva.Layer) => {
  renderGridBorder(layer)
  renderBasicGrid(layer)
  renderCrossGrid(layer)
  renderPlusGrid(layer)
}

// Export individual grid rendering functions for testing
export { renderGridBorder, renderBasicGrid, renderPlusGrid, renderCrossGrid }
