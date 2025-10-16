import Konva from 'konva'
import { Point, getCenter, getDistance } from './utils'
import { renderGrid, renderRiceGrid } from './grids'
import { Line, LineConfig } from 'konva/lib/shapes/Line'

enum GridMode {
  Grid = 1,
  Rice,
}

interface AppState {
  stage: Konva.Stage
  drawingLayer: Konva.Layer
  graphLayer: Konva.Layer
  paperLayer: Konva.Layer
  lastLine: Konva.Line | null
  isPaint: boolean
  isDragging: boolean
  isTouching2: boolean
  lastCenter: Point | null
  lastDist: number
  dragStopped: boolean
  canvasStateHistory: Konva.Line[]
  historyIndex: number
  redoCache: Line<LineConfig>[]
}

export const state: AppState = {
  stage: null!,
  drawingLayer: null!,
  graphLayer: null!,
  paperLayer: null!,
  lastLine: null,
  isPaint: false,
  isDragging: false,
  isTouching2: false,
  lastCenter: null,
  lastDist: 0,
  dragStopped: false,
  canvasStateHistory: [],
  historyIndex: 0,
  redoCache: [],
}

export const config = {
  saveEnabled: localStorage.getItem('save-enabled') !== 'false',
  gridMode: localStorage.getItem('grid-mode') !== 'rice' ? GridMode.Grid : GridMode.Rice,
  mode: 'brush',
  scaleBy: 1.05,
}

export const setupCanvas = () => {
  Konva.hitOnDragEnabled = true
  const savedState = config.saveEnabled ? localStorage.getItem('canvas-grid-state') : null

  if (savedState) {
    state.stage = Konva.Node.create(savedState, 'container')
    state.stage.x(0).y(0).scaleX(1).scaleY(1)
    state.graphLayer = state.stage.findOne('.graph-layer') || new Konva.Layer({ name: 'graph-layer' })
    state.paperLayer = state.stage.findOne('.paper-layer') || new Konva.Layer({ name: 'paper-layer' })
    state.drawingLayer = state.stage.findOne('.drawing-layer') || new Konva.Layer({ name: 'drawing-layer' })
    state.stage.removeChildren()
  } else {
    state.stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight,
    })
    state.drawingLayer = new Konva.Layer({ name: 'drawing-layer' })
    state.graphLayer = new Konva.Layer({ name: 'graph-layer' })
    state.paperLayer = new Konva.Layer({ name: 'paper-layer' })
    const rect = new Konva.Rect({
      fill: '#f9f5ef',
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    })
    state.paperLayer.add(rect)
  }

  state.stage.add(state.paperLayer, state.graphLayer, state.drawingLayer)

  setupEventListeners()
  renderGridLayer()
}

export const setupEventListeners = () => {
  state.stage.on('mousedown touchstart', handleDrawStart)
  state.stage.on('mousemove touchmove', handleDrawMove)
  state.stage.on('mouseup touchend', handleDrawEnd)
  state.stage.on('wheel', handleWheel)
}

export const handleDrawStart = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  const pos = state.drawingLayer.getRelativePointerPosition()
  if (!pos) return

  if (e.type === 'touchstart') {
    e.evt.preventDefault()
    const touch2 = (e.evt as TouchEvent).touches[1]
    if (touch2 || state.isTouching2) return
  }

  state.isDragging = true
  state.isPaint = true
  state.lastLine = new Konva.Line({
    stroke: '#3a4045',
    strokeWidth: 4,
    globalCompositeOperation: config.mode === 'brush' ? 'source-over' : 'destination-out',
    lineCap: 'round',
    lineJoin: 'round',
    points: [pos.x, pos.y, pos.x, pos.y],
  })
  state.drawingLayer.add(state.lastLine)
}

export const handleDrawMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  if (e.type === 'touchmove') {
    e.evt.preventDefault()
    const touch1 = (e.evt as TouchEvent).touches[0]
    const touch2 = (e.evt as TouchEvent).touches[1]

    if (touch1 && !touch2 && !state.stage.isDragging() && state.dragStopped) {
      state.stage.startDrag()
      state.dragStopped = false
    }

    if (touch2) {
      handleMultiTouch(touch1, touch2)
      return
    }
  }

  if (!state.isDragging || !state.isPaint || state.isTouching2) return

  const pos = state.drawingLayer.getRelativePointerPosition()
  if (!pos || pos.x < 0 || pos.y < 0 || pos.x >= state.drawingLayer.width() || pos.y >= state.drawingLayer.height())
    return

  const newPoints = state.lastLine!.points().concat([pos.x, pos.y])
  state.lastLine!.points(newPoints)
}

export const handleMultiTouch = (touch1: Touch, touch2: Touch) => {
  state.isTouching2 = true
  state.isPaint = false
  if (state.lastLine) state.lastLine.destroy()

  if (state.stage.isDragging()) {
    state.dragStopped = true
    state.stage.stopDrag()
  }

  const p1 = { x: touch1.clientX, y: touch1.clientY }
  const p2 = { x: touch2.clientX, y: touch2.clientY }
  const newCenter = getCenter(p1, p2)
  const dist = getDistance(p1, p2)

  if (!state.lastCenter) {
    state.lastCenter = newCenter
    state.lastDist = dist
    return
  }

  const pointTo = {
    x: (newCenter.x - state.stage.x()) / state.stage.scaleX(),
    y: (newCenter.y - state.stage.y()) / state.stage.scaleY(),
  }

  const scale = state.stage.scaleX() * (dist / state.lastDist)
  state.stage.scale({ x: scale, y: scale })

  const dx = newCenter.x - state.lastCenter.x
  const dy = newCenter.y - state.lastCenter.y
  const newPos = {
    x: newCenter.x - pointTo.x * scale + dx,
    y: newCenter.y - pointTo.y * scale + dy,
  }
  state.stage.position(newPos)

  state.lastDist = dist
  state.lastCenter = newCenter
}

export const handleDrawEnd = () => {
  if (state.isPaint) updateCanvasState()
  state.lastDist = 0
  state.lastCenter = null
  state.isPaint = false
  state.isDragging = false
  state.isTouching2 = false
  if (config.saveEnabled) localStorage.setItem('canvas-grid-state', state.stage.toJSON())
}

export const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
  e.evt.preventDefault()

  const oldScale = state.stage.scaleX()
  const pointer = state.stage.getPointerPosition()
  if (!pointer) return

  const mousePointTo = {
    x: (pointer.x - state.stage.x()) / oldScale,
    y: (pointer.y - state.stage.y()) / oldScale,
  }

  let newScale: number
  let newPos: { x: number; y: number }

  if (e.evt.ctrlKey) {
    const direction = e.evt.deltaY > 0 ? -1 : 1
    newScale = direction > 0 ? oldScale * config.scaleBy : oldScale / config.scaleBy
    state.stage.scale({ x: newScale, y: newScale })

    newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
  } else {
    newPos = {
      x: state.stage.x() + e.evt.deltaX,
      y: state.stage.y() + e.evt.deltaY,
    }
  }

  state.stage.position(newPos)
}

export const updateCanvasState = () => {
  state.canvasStateHistory = state.canvasStateHistory.slice(0, state.historyIndex)
  state.canvasStateHistory.push(state.lastLine!)
  state.redoCache = []
  state.historyIndex++
}

export const undo = () => {
  if (state.historyIndex <= 0) return
  const lineToUndo = state.canvasStateHistory[--state.historyIndex]
  state.redoCache.push(lineToUndo)
  lineToUndo.hide()
}

export const redo = () => {
  const lineToRedo = state.redoCache.pop()
  if (!lineToRedo) return
  lineToRedo.show()
  state.canvasStateHistory[state.historyIndex++] = lineToRedo
}

export const renderGridLayer = () => {
  if (config.gridMode === GridMode.Rice) {
    renderRiceGrid(state.graphLayer)
  } else {
    renderGrid(state.graphLayer)
  }
}

export const clearCanvas = () => {
  state.drawingLayer.destroyChildren()
  state.graphLayer.destroyChildren()
  renderGridLayer()
  localStorage.removeItem('canvas-grid-state')
  state.stage.position({ x: 0, y: 0 })
  state.stage.scale({ x: 1, y: 1 })
}

setupCanvas()

window.addEventListener('beforeunload', () => {
  if (config.saveEnabled) {
    localStorage.setItem('canvas-grid-state', state.stage.toJSON())
  } else {
    localStorage.removeItem('canvas-grid-state')
  }
})

window.addEventListener('focus', () => {
  // TODO: Optimize this so refocusing isn't as slow
  // setupCanvas();
})

window.addEventListener('blur', () => {
  if (config.saveEnabled) {
    localStorage.setItem('canvas-grid-state', state.stage.toJSON())
  }
})

export const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  // Check if the Ctrl key is pressed
  if (event.ctrlKey || event.metaKey) {
    // metaKey for Mac support
    switch (event.key.toLowerCase()) {
      case 'z':
        // Ctrl+Z for undo
        if (!event.shiftKey) {
          event.preventDefault() // Prevent default browser undo
          undo()
        }
        // Ctrl+Shift+Z for redo
        else {
          event.preventDefault() // Prevent default browser redo
          redo()
        }
        break
      case 'y':
        // Ctrl+Y for redo (alternative shortcut)
        event.preventDefault()
        redo()
        break
    }
  }
}

window.addEventListener('keydown', handleKeyboardShortcuts)

document.addEventListener('DOMContentLoaded', () => {
  const deleteIconButton = document.getElementById('discard-canvas-button')
  deleteIconButton?.addEventListener('click', clearCanvas)

  const undoIconButton = document.getElementById('undo-icon-button')
  undoIconButton?.addEventListener('click', undo)

  const redoIconButton = document.getElementById('redo-icon-button')
  redoIconButton?.addEventListener('click', redo)
})
