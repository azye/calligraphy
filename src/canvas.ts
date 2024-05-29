// @ts-nocheck
import Konva from 'konva'
import { getCenter, getDistance } from './utils'
import { Label } from 'konva/lib/shapes/Label'
import { Layer } from 'konva/lib/Layer'

const renderGrid = (layer: Konva.Layer) => {
  const BUFFER = 20 // min margin buffer size
  const CELL_SIZE = 75

  const gridCols = Math.floor((layer.hitCanvas.width - BUFFER * 2) / 75)
  const gridRows = Math.floor((layer.hitCanvas.height - BUFFER * 2) / 75)

  const startX = (layer.hitCanvas.width - gridCols * CELL_SIZE) / 2
  const startY = (layer.hitCanvas.height - gridRows * CELL_SIZE) / 2

  var poly = new Konva.Line({
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
    var p = new Konva.Line({
      points: [startX + i * CELL_SIZE, startY, startX + i * CELL_SIZE, layer.hitCanvas.height - startY],
      stroke: 'black',
      strokeWidth: 2,
    })

    layer.add(p)
  }

  for (let i = 1; i < gridRows; i++) {
    var p = new Konva.Line({
      points: [startX, startY + i * CELL_SIZE, layer.hitCanvas.width - startX, startY + i * CELL_SIZE],
      stroke: 'black',
      strokeWidth: 2,
    })

    layer.add(p)
  }
}
let stage
let drawingLayer

const setupCounter = () => {
  Konva.hitOnDragEnabled = true
  const state = localStorage.getItem('canvas-grid-state')
  const saveEnabled = localStorage.getItem('save-enabled') === 'true'
  var lastCenter = null
  var lastDist = 0
  var dragStopped = false
  var isPaint = false
  var mode = 'brush'
  var lastLine
  // touching1 and touching2 are used to prevent lines from being drawn on finger lift
  var touching1 = false
  var touching2 = false
  var isdragging = false
  // let stage
  drawingLayer = new Konva.Layer({ name: 'drawing-layer' })
  var graphLayer = new Konva.Layer()
  var paperLayer = new Konva.Layer()

  if (saveEnabled && state) {
    stage = Konva.Node.create(state, 'container')
    stage.x(0)
    stage.y(0)
    stage.scaleX(1)
    stage.scaleY(1)
    // todo: restore the drawing layer so that we can erase
  } else {
    stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight,
    })

    stage.add(paperLayer)
    stage.add(graphLayer)
  }
  stage.add(drawingLayer)

  var rect = new Konva.Rect({
    fill: '#f9f5ef',
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  })

  paperLayer.add(rect)

  stage.on('mousedown', () => {
    isdragging = true

    var pos = drawingLayer.getRelativePointerPosition()
    lastLine = new Konva.Line({
      stroke: '#3a4045',
      strokeWidth: 4 / stage.scaleX(),
      globalCompositeOperation: mode === 'brush' ? 'source-over' : 'destination-out',
      // round cap for smoother lines
      lineCap: 'round',
      lineJoin: 'round',
      // add point twice, so we have some drawings even on a simple click
      points: [pos.x, pos.y, pos.x, pos.y],
    })
    drawingLayer.add(lastLine)
  })

  stage.on('touchstart', (e) => {
    e.evt.preventDefault()
    var touch1 = e.evt.touches[0]
    var touch2 = e.evt.touches[1]
    var pos = drawingLayer.getRelativePointerPosition()

    if (
      touch1 &&
      !touch2 &&
      !isPaint &&
      pos.x >= 0 &&
      pos.y >= 0 &&
      pos.x < drawingLayer.hitCanvas.width &&
      pos.y < drawingLayer.hitCanvas.height
    ) {
      touching1 = true

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
    var pos = drawingLayer.getRelativePointerPosition()
    if (pos.x >= 0 && pos.y >= 0) {
      var newPoints = lastLine.points().concat([pos.x, pos.y])
      lastLine.points(newPoints)
    }
  })

  stage.on('touchmove', function (e) {
    e.evt.preventDefault()
    var touch1 = e.evt.touches[0]
    var touch2 = e.evt.touches[1]

    // we need to restore dragging, if it was cancelled by multi-touch
    if (touch1 && !touch2 && !stage.isDragging() && dragStopped) {
      touching1 = true
      stage.startDrag()
      dragStopped = false
    }

    if (isPaint && !touch2) {
      if (touching2) {
        return
      }
      var pos = drawingLayer.getRelativePointerPosition()

      if (pos.x >= 0 && pos.y >= 0 && pos.x < drawingLayer.hitCanvas.width && pos.y < drawingLayer.hitCanvas.height) {
        var newPoints = lastLine.points().concat([pos.x, pos.y])
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
      touching1 = true
      isPaint = false
      // if the stage was under Konva's drag&drop
      // we need to stop it, and implement our own pan logic with two pointers
      if (stage.isDragging()) {
        dragStopped = true
        stage.stopDrag()
      }

      var p1 = {
        x: touch1.clientX,
        y: touch1.clientY,
      }
      var p2 = {
        x: touch2.clientX,
        y: touch2.clientY,
      }

      if (!lastCenter) {
        lastCenter = getCenter(p1, p2)
        return
      }
      var newCenter = getCenter(p1, p2)
      var dist = getDistance(p1, p2)

      if (!lastDist) {
        lastDist = dist
      }

      // local coordinates of center point
      var pointTo = {
        x: (newCenter.x - stage.x()) / stage.scaleX(),
        y: (newCenter.y - stage.y()) / stage.scaleY(),
      }

      var scale = stage.scaleX() * (dist / lastDist)

      stage.scaleX(scale)
      stage.scaleY(scale)

      // calculate new position of the stage
      var dx = newCenter.x - lastCenter.x
      var dy = newCenter.y - lastCenter.y

      var newPos = {
        x: newCenter.x - pointTo.x * scale + dx,
        y: newCenter.y - pointTo.y * scale + dy,
      }

      stage.position(newPos)

      lastDist = dist
      lastCenter = newCenter
    }
  })

  stage.on('mouseup touchend', function (e) {
    lastDist = 0
    lastCenter = null
    isPaint = false
    isdragging = false
    touching1 = false
    touching2 = false
  })

  renderGrid(graphLayer)
  window.onbeforeunload = function () {
    saveEnabled && localStorage.setItem('canvas-grid-state', stage.toJSON())
    !saveEnabled && this.localStorage.removeItem('canvas-grid-state')
  }
}

setupCounter()

// declare var stage;
document.addEventListener('DOMContentLoaded', () => {
  const deleteIconButton = document?.getElementById('delete-icon-button')
  deleteIconButton?.addEventListener('click', () => {
    // todo: add confirmation modal
    drawingLayer.removeChildren()
    // todo: close menu
  })
})
