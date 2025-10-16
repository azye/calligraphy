import Konva from 'konva'
import { Point } from './utils'
import { Line, LineConfig } from 'konva/lib/shapes/Line'

export interface AppState {
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
