// @ts-nocheck
import Konva from 'konva'
import { getCenter, getDistance } from './utils'

const renderGrid = (layer: Konva.Layer) => {
  const BUFFER = 65

  var poly = new Konva.Line({
    points: [
      0 + BUFFER,
      0 + BUFFER,
      0 + BUFFER,
      layer.hitCanvas.height - BUFFER,
      layer.hitCanvas.width - BUFFER,
      layer.hitCanvas.height - BUFFER,
      layer.hitCanvas.width - BUFFER,
      BUFFER,
      BUFFER,
      BUFFER,
    ],
    stroke: 'black',
    strokeWidth: 3,
    closed: true,
  })

  // add the shape to the layer
  layer.add(poly)

  const gridCols = Math.floor((layer.hitCanvas.width - BUFFER * 2) / 75)
  const gridRows = Math.floor((layer.hitCanvas.height - BUFFER * 2) / 75)


  for (let i = 0; i < gridCols; i++) {
    var p = new Konva.Line({
      points: [
        BUFFER + i * ((layer.hitCanvas.width - BUFFER * 2) / gridCols),
        BUFFER,
        BUFFER + i * ((layer.hitCanvas.width - BUFFER * 2) / gridCols),
        layer.hitCanvas.height - BUFFER,
      ],
      stroke: 'black',
      strokeWidth: 2,
    })

    layer.add(p)
  }

  for (let i = 0; i < gridRows; i++) {
    var p = new Konva.Line({
      points: [
        BUFFER,
        BUFFER + i * ((layer.hitCanvas.height - BUFFER * 2) / gridRows),
        layer.hitCanvas.width - BUFFER,
        BUFFER + i * ((layer.hitCanvas.height - BUFFER * 2) / gridRows),
      ],
      stroke: 'black',
      strokeWidth: 2,
    })

    layer.add(p)
  }
}

const setupCounter = () => {
  Konva.hitOnDragEnabled = true

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

  // first we need Konva core things: stage and layer
  var stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight,
  })

  var layer = new Konva.Layer()
  var graphLayer = new Konva.Layer()
  var paperLayer = new Konva.Layer()

  // order matters here
  stage.add(paperLayer)
  stage.add(graphLayer)
  stage.add(layer)

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

    var pos = layer.getRelativePointerPosition()
    lastLine = new Konva.Line({
      stroke: 'blue',
      strokeWidth: 4 / stage.scaleX(),
      globalCompositeOperation: mode === 'brush' ? 'source-over' : 'destination-out',
      // round cap for smoother lines
      lineCap: 'round',
      lineJoin: 'round',
      // add point twice, so we have some drawings even on a simple click
      points: [pos.x, pos.y, pos.x, pos.y],
    })
    layer.add(lastLine)
  })

  stage.on('touchstart', (e) => {
    e.evt.preventDefault()
    var touch1 = e.evt.touches[0]
    var touch2 = e.evt.touches[1]
    var pos = layer.getRelativePointerPosition()

    if (touch1 && !touch2 && !isPaint && pos.x >= 0 && pos.y >= 0 && pos.x < layer.hitCanvas.width && pos.y < layer.hitCanvas.height) {
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
      layer.add(lastLine)
    }
  })

  stage.on('mousemove', () => {
    if (!isdragging) {
      return
    }
    var pos = layer.getRelativePointerPosition()
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
      var pos = layer.getRelativePointerPosition()

      if (pos.x >= 0 && pos.y >= 0 && pos.x < layer.hitCanvas.width && pos.y < layer.hitCanvas.height) {
        var newPoints = lastLine.points().concat([pos.x, pos.y])
        lastLine.points(newPoints)
      }
    }

    if (touch2 && isPaint) {
      touching2 = true
      // this makes it so putting your second finger down will make a drawn line disappear
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

    var touch1 = e.evt.touches[0]
    var touch2 = e.evt.touches[1]

    if (!touch1 && !touch2) {
      touching1 = false
      touching2 = false
    }
  })
  
  renderGrid(graphLayer)
}

setupCounter()
