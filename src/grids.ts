import Konva from 'konva'

const BUFFER = 20 // min margin buffer size
const CELL_SIZE = 75

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

const renderCrossGrid = (layer: Konva.Layer) => {
  const gridCols = Math.floor((layer.hitCanvas.width - BUFFER * 2) / 75)
  const gridRows = Math.floor((layer.hitCanvas.height - BUFFER * 2) / 75)

  const startX = (layer.hitCanvas.width - gridCols * CELL_SIZE) / 2
  const startY = (layer.hitCanvas.height - gridRows * CELL_SIZE) / 2

  for (let i = 1; i <= gridCols; i++) {
    const p = new Konva.Line({
      points: [
        startX + i * CELL_SIZE,
        startY,
        (i <= gridRows) ? startX : startX + Math.abs(gridRows - i) * CELL_SIZE,
        (startY + i * CELL_SIZE) <= layer.hitCanvas.height - BUFFER ? startY + i * CELL_SIZE : (layer.hitCanvas.height - startY)
    ],
      stroke: 'black',
      strokeWidth: 1,
    })

    if (i > gridCols - gridRows) {
        const r = new Konva.Line({
      points: [
        startX + i * CELL_SIZE,
        layer.hitCanvas.height - startY,
        layer.hitCanvas.width - startX,
        startY + (gridRows - Math.abs(gridCols - i)) * CELL_SIZE
    ],
      stroke: 'black',
      strokeWidth: 1,
    })
    layer.add(r)
    }

    layer.add(p)
  }
}

export const renderGrid = (layer: Konva.Layer) => {
  //   const gridCols = Math.floor((layer.hitCanvas.width - BUFFER * 2) / 75)
  //   const gridRows = Math.floor((layer.hitCanvas.height - BUFFER * 2) / 75)

  //   const startX = (layer.hitCanvas.width - gridCols * CELL_SIZE) / 2
  //   const startY = (layer.hitCanvas.height - gridRows * CELL_SIZE) / 2

  renderGridBorder(layer)
  renderBasicGrid(layer)
  //   for (let i = 1; i < gridCols; i++) {
  //     const p = new Konva.Line({
  //       points: [startX + i * CELL_SIZE, startY, startX + i * CELL_SIZE, layer.hitCanvas.height - startY],
  //       stroke: 'black',
  //       strokeWidth: 2,
  //     })

  //     layer.add(p)
  //   }

  //   for (let i = 1; i < gridRows; i++) {
  //     const p = new Konva.Line({
  //       points: [startX, startY + i * CELL_SIZE, layer.hitCanvas.width - startX, startY + i * CELL_SIZE],
  //       stroke: 'black',
  //       strokeWidth: 2,
  //     })

  //     layer.add(p)
  //   }
}

export const renderRiceGrid = (layer: Konva.Layer) => {
  // const gridCols = Math.floor((layer.hitCanvas.width - BUFFER * 2) / 75)
  //   const gridRows = Math.floor((layer.hitCanvas.height - BUFFER * 2) / 75)

  //   const startX = (layer.hitCanvas.width - gridCols * CELL_SIZE) / 2
  //   const startY = (layer.hitCanvas.height - gridRows * CELL_SIZE) / 2
  renderGridBorder(layer)
  renderBasicGrid(layer)
  renderCrossGrid(layer)
}
