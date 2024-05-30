import Konva from 'konva'
import { Point, getCenter, getDistance } from './utils'

const renderGrid = (layer: Konva.Layer) => {
  const BUFFER = 20 // min margin buffer size
  const CELL_SIZE = 75

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

let stage: Konva.Stage
let drawingLayer: Konva.Layer
let saveEnabled: boolean = true
const mode = 'brush'

const setupCanvas = () => {
  Konva.hitOnDragEnabled = true
  const state = localStorage.getItem('canvas-grid-state')
  saveEnabled = saveEnabled || localStorage.getItem('save-enabled') === 'true'
  let lastCenter: Point | null
  let lastDist = 0
  let dragStopped = false
  let isPaint = false
  let lastLine: Konva.Line
  // touching2 is used to prevent lines from being drawn on finger lift
  let touching2 = false
  let isdragging = false
  let graphLayer
  let paperLayer

  if (saveEnabled && state) {
    stage = Konva.Node.create(state, 'container')
    stage.x(0)
    stage.y(0)
    stage.scaleX(1)
    stage.scaleY(1)
    graphLayer = stage.children[0]
    paperLayer = stage.children[1]
    drawingLayer = stage.children[2]
    stage.removeChildren()
  } else {
    stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight,
    })
    drawingLayer = new Konva.Layer({ name: 'drawing-layer' })
    graphLayer = new Konva.Layer({ name: 'graph-layer' })
    paperLayer = new Konva.Layer({ name: 'paper-layer' })
    const rect = new Konva.Rect({
      fill: '#f9f5ef',
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    })

    paperLayer.add(rect)
  }
  stage.add(paperLayer)
  stage.add(graphLayer)
  stage.add(drawingLayer)

  stage.on('mousedown', () => {
    isdragging = true
    const pos = drawingLayer.getRelativePointerPosition()
    if (pos) {
      lastLine = new Konva.Line({
        stroke: '#3a4045',
        strokeWidth: 4,
        globalCompositeOperation: mode === 'brush' ? 'source-over' : 'destination-out',
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [pos.x, pos.y, pos.x, pos.y],
      })
      drawingLayer.add(lastLine)
    }
  })

  stage.on('touchstart', (e) => {
    e.evt.preventDefault()
    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]
    const pos = drawingLayer.getRelativePointerPosition()

    if (
      pos &&
      touch1 &&
      !touch2 &&
      !isPaint &&
      pos.x >= 0 &&
      pos.y >= 0 &&
      pos.x < drawingLayer.hitCanvas.width &&
      pos.y < drawingLayer.hitCanvas.height
    ) {
      if (touching2) {
        return
      }

      isPaint = true
      lastLine = new Konva.Line({
        stroke: '#302e2e',
        strokeWidth: 4,
        globalCompositeOperation: mode === 'brush' ? 'source-over' : 'destination-out',
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [pos.x, pos.y, pos.x, pos.y],
      })
      drawingLayer.add(lastLine)
    }
  })

  stage.on('mousemove', () => {
    if (!isdragging) {
      return
    }
    const pos = drawingLayer.getRelativePointerPosition()
    if (pos && pos.x >= 0 && pos.y >= 0) {
      const newPoints = lastLine.points().concat([pos.x, pos.y])
      lastLine.points(newPoints)
    }
  })

  stage.on('touchmove', function (e) {
    e.evt.preventDefault()
    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]

    // we need to restore dragging, if it was cancelled by multi-touch
    if (touch1 && !touch2 && !stage.isDragging() && dragStopped) {
      // touching1 = true
      stage.startDrag()
      dragStopped = false
    }

    if (isPaint && !touch2) {
      if (touching2) {
        return
      }
      const pos = drawingLayer.getRelativePointerPosition()

      if (
        pos &&
        pos.x >= 0 &&
        pos.y >= 0 &&
        pos.x < drawingLayer.hitCanvas.width &&
        pos.y < drawingLayer.hitCanvas.height
      ) {
        const newPoints = lastLine.points().concat([pos.x, pos.y])
        lastLine.points(newPoints)
      }
    }

    if (touch2 && isPaint) {
      touching2 = true
      // this makes it so putting your second finger down wont produce dots
      lastLine.destroy()
    }

    if (touch1 && touch2) {
      touching2 = true
      // touching1 = true
      isPaint = false
      // if the stage was under Konva's drag&drop
      // we need to stop it, and implement our own pan logic with two pointers
      if (stage.isDragging()) {
        dragStopped = true
        stage.stopDrag()
      }

      const p1 = {
        x: touch1.clientX,
        y: touch1.clientY,
      }
      const p2 = {
        x: touch2.clientX,
        y: touch2.clientY,
      }

      if (!lastCenter) {
        lastCenter = getCenter(p1, p2)
        return
      }
      const newCenter = getCenter(p1, p2)
      const dist = getDistance(p1, p2)

      if (!lastDist) {
        lastDist = dist
      }

      // local coordinates of center point
      const pointTo = {
        x: (newCenter.x - stage.x()) / stage.scaleX(),
        y: (newCenter.y - stage.y()) / stage.scaleY(),
      }

      const scale = stage.scaleX() * (dist / lastDist)

      stage.scaleX(scale)
      stage.scaleY(scale)

      // calculate new position of the stage
      const dx = newCenter.x - lastCenter.x
      const dy = newCenter.y - lastCenter.y

      const newPos = {
        x: newCenter.x - pointTo.x * scale + dx,
        y: newCenter.y - pointTo.y * scale + dy,
      }

      stage.position(newPos)

      lastDist = dist
      lastCenter = newCenter
    }
  })

  stage.on('mouseup touchend', () => {
    lastDist = 0
    lastCenter = null
    isPaint = false
    isdragging = false
    touching2 = false
  })

  const scaleBy = 1.05
  stage.on('wheel', (e) => {
    // stop default scrolling
    e.evt.preventDefault()

    if (e.evt.ctrlKey) {
      const oldScale = stage.scaleX()
      const pointer = stage.getPointerPosition()

      if (!pointer) {
        return
      }

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      }

      // how to scale? Zoom in? Or zoom out?
      const direction = e.evt.deltaY > 0 ? -1 : 1

      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy

      stage.scale({ x: newScale, y: newScale })

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      }
      stage.position(newPos)
    } else {
      const newPos = {
        x: stage.x() + e.evt.deltaX,
        y: stage.y() + e.evt.deltaY,
      }

      stage.position(newPos)
    }
  })

  renderGrid(graphLayer)
}

setupCanvas()

window.onbeforeunload = function () {
  saveEnabled && localStorage.setItem('canvas-grid-state', stage.toJSON())
  !saveEnabled && localStorage.removeItem('canvas-grid-state')
}

// declare let stage;
document.addEventListener('DOMContentLoaded', () => {
  const deleteIconButton = document?.getElementById('delete-icon-button')
  deleteIconButton?.addEventListener('click', () => {
    // todo: add confirmation modal
    drawingLayer.removeChildren()
    stage.x(0)
    stage.y(0)
    stage.scaleY(1)
    stage.scaleX(1)

    // todo: close menu
  })
})
