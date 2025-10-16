import Konva from 'konva'
// import { reversePointArray } from './utils'

const BUFFER = 20 // min margin buffer size
const CELL_SIZE = 75
const DEFAULT_GRID_LINE = {
  dash: [1, 1],
  stroke: 'black',
  strokeWidth: 1,
}

const reversePointArray = (arr: number[]): number[] => {
  const a = arr[0]
  const b = arr[1]

  arr[0] = arr[2]
  arr[1] = arr[3]
  arr[2] = a
  arr[3] = b

  return arr
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
  const horizLines = new Konva.Group()
  const horizLinesCache = new Set() // todo: implement this so no dups

  for (let i = 1; i <= gridRows; i++) {
    const p1Pts = [
      startX,
      startY + i * CELL_SIZE,
      i <= gridCols ? startX + i * CELL_SIZE : layer.hitCanvas.width - startX,
      i <= gridCols ? startY : startY + Math.abs(gridCols - i) * CELL_SIZE,
    ]
    // const p1PtsRev =  [
    //     i <= gridCols ? startX + i * CELL_SIZE : layer.hitCanvas.width - startX,
    //     i <= gridCols ? startY : startY + Math.abs(gridCols - i) * CELL_SIZE,
    //     startX,
    //     startY + i * CELL_SIZE,

    //   ]
    const p2Pts = [
      layer.hitCanvas.width - startX,
      startY + i * CELL_SIZE,
      i <= gridCols ? layer.hitCanvas.width - (startX + i * CELL_SIZE) : startX,
      i <= gridCols ? startY : startY + Math.abs(gridCols - i) * CELL_SIZE,
    ]

    // const p2PtsRev =  [
    //     i <= gridCols ? layer.hitCanvas.width - (startX + i * CELL_SIZE) : startX,
    //     i <= gridCols ? startY : startY + Math.abs(gridCols - i) * CELL_SIZE,
    //     layer.hitCanvas.width - startX,
    //     startY + i * CELL_SIZE,
    //   ]
    const a1 = p1Pts.join(',')
    const a2 = p2Pts.join(',')
    const a3 = reversePointArray(p1Pts).join(',')
    const a4 = reversePointArray(p2Pts).join(',')

    if (!horizLinesCache.has(a1) && !horizLinesCache.has(a3)) {
      const p = new Konva.Line({
        points: p1Pts,
        ...DEFAULT_GRID_LINE,
      })
      horizLines.add(p)
    }
    if (!horizLinesCache.has(a2) && !horizLinesCache.has(a4)) {
      const p2 = new Konva.Line({
        points: p2Pts,
        ...DEFAULT_GRID_LINE,
      })
      horizLines.add(p2)
    }
    horizLinesCache.add(a1)
    horizLinesCache.add(a2)
    horizLinesCache.add(a3)
    horizLinesCache.add(a4)
    console.log(horizLinesCache)
  }

  for (let i = 0; i <= gridCols; i++) {
    const pPts = [
      startX + i * CELL_SIZE,
      startY,
      i <= gridRows ? startX : startX + Math.abs(gridRows - i) * CELL_SIZE,
      startY + i * CELL_SIZE <= layer.hitCanvas.height - startY
        ? startY + i * CELL_SIZE
        : layer.hitCanvas.height - startY,
    ]

    const p2Pts = [
      i <= gridRows ? startX : startX + Math.abs(gridRows - i) * CELL_SIZE,
      startY + (gridRows - i) * CELL_SIZE <= startY ? startY : startY + (gridRows - i) * CELL_SIZE,
      startX + i * CELL_SIZE,
      layer.hitCanvas.height - startY,
    ]

    const a1 = pPts.join(',')
    const a2 = p2Pts.join(',')
    const a3 = reversePointArray(pPts).join(',')
    const a4 = reversePointArray(p2Pts).join(',')

    if (!horizLinesCache.has(a1) && !horizLinesCache.has(a3)) {
      const p = new Konva.Line({
        points: pPts,
        ...DEFAULT_GRID_LINE,
      })
      horizLines.add(p)
    }
    if (!horizLinesCache.has(a2) && !horizLinesCache.has(a4)) {
      const p2 = new Konva.Line({
        points: p2Pts,
        ...DEFAULT_GRID_LINE,
      })
      horizLines.add(p2)
    }

    horizLinesCache.add(a1)
    horizLinesCache.add(a2)
    horizLinesCache.add(a3)
    horizLinesCache.add(a4)

    if (i >= gridCols - gridRows) {
      const rPts = [
        startX + i * CELL_SIZE,
        layer.hitCanvas.height - startY,
        layer.hitCanvas.width - startX,
        startY + (gridRows - Math.abs(gridCols - i)) * CELL_SIZE,
      ]

      const r2Pts = [
        layer.hitCanvas.width - (startX + Math.abs(i) * CELL_SIZE),
        layer.hitCanvas.height - startY,
        startX,
        startY + (gridRows - Math.abs(gridCols - i)) * CELL_SIZE,
      ]

      const a5 = rPts.join(',')
      const a6 = r2Pts.join(',')
      const a7 = reversePointArray(rPts).join(',')
      const a8 = reversePointArray(r2Pts).join(',')

      if (!horizLinesCache.has(a5) && !horizLinesCache.has(a7)) {
        const r = new Konva.Line({
          points: rPts,
          ...DEFAULT_GRID_LINE,
        })
        horizLines.add(r)
      }
      if (!horizLinesCache.has(a6) && !horizLinesCache.has(a8)) {
        const r2 = new Konva.Line({
          points: r2Pts,
          ...DEFAULT_GRID_LINE,
        })
        horizLines.add(r2)
      }
      horizLinesCache.add(a6)
      horizLinesCache.add(a6)
      horizLinesCache.add(a7)
      horizLinesCache.add(a8)
      // const r = new Konva.Line({
      //   points: rPts,
      // ...DEFAULT_GRID_LINE
      // })
      // const r2 = new Konva.Line({
      //   points: r2Pts,
      //   ...DEFAULT_GRID_LINE
      // })
      // horizLines.add(r)
      // horizLines.add(r2)
    }
  }
  layer.add(horizLines)
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
