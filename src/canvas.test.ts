/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupCanvas, undo, redo, clearCanvas, state, handleDrawStart, handleDrawEnd, handleDrawMove } from './canvas'
import Konva from 'konva'

// Mock Konva
vi.mock('konva', () => {
  const mockStage = {
    add: vi.fn(),
    on: vi.fn(),
    getPointerPosition: vi.fn(),
    getRelativePointerPosition: vi.fn(() => ({ x: 10, y: 10 })),
    scale: vi.fn(),
    scaleX: vi.fn(),
    scaleY: vi.fn(),
    x: vi.fn(),
    y: vi.fn(),
    position: vi.fn(),
    toJSON: vi.fn().mockReturnValue('{}'),
    findOne: vi.fn(),
    removeChildren: vi.fn(),
    startDrag: vi.fn(),
    stopDrag: vi.fn(),
    isDragging: vi.fn(() => false),
  }

  const mockLayer = {
    add: vi.fn(),
    destroyChildren: vi.fn(),
    getRelativePointerPosition: vi.fn(() => ({ x: 10, y: 10 })),
    width: vi.fn(() => 800),
    height: vi.fn(() => 600),
    hitCanvas: {
      width: 800,
      height: 600,
    },
  }

  const mockLine = {
    points: vi.fn().mockReturnValue([]),
    destroy: vi.fn(),
    hide: vi.fn(),
    show: vi.fn(),
  }

  const Konva = {
    Stage: vi.fn(() => mockStage),
    Layer: vi.fn(() => mockLayer),
    Line: vi.fn(() => mockLine),
    Rect: vi.fn(),
    Node: {
      create: vi.fn(),
    },
    hitOnDragEnabled: false,
  }
  return { default: Konva }
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    getElementById: vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      style: {},
    }),
    querySelectorAll: vi.fn().mockReturnValue([]),
    addEventListener: vi.fn(),
  },
  writable: true,
})

describe('canvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.canvasStateHistory = []
    state.historyIndex = 0
    state.redoCache = []
    state.lastLine = null
    state.isPaint = false
  })

  it('should setup canvas', () => {
    setupCanvas()
    expect(Konva.Stage).toHaveBeenCalled()
  })

  it('should undo and redo', () => {
    const line = new Konva.Line()
    state.canvasStateHistory.push(line)
    state.historyIndex = 1

    undo()
    expect(line.hide).toHaveBeenCalled()
    expect(state.historyIndex).toBe(0)
    expect(state.redoCache.length).toBe(1)

    redo()
    expect(line.show).toHaveBeenCalled()
    expect(state.historyIndex).toBe(1)
    expect(state.redoCache.length).toBe(0)
  })

  it('should clear canvas', () => {
    setupCanvas()
    clearCanvas()
    expect(state.drawingLayer.destroyChildren).toHaveBeenCalled()
    expect(state.graphLayer.destroyChildren).toHaveBeenCalled()
  })

  it('should handle draw start, move and end', () => {
    setupCanvas()
    const event = {
        type: 'mousedown',
        evt: { preventDefault: vi.fn() } as any,
        target: new Konva.Rect(), // Mock target
        pointerId: 0,
        currentTarget: new Konva.Rect(), // Mock currentTarget
        cancelBubble: false,
    };
    handleDrawStart(event as Konva.KonvaEventObject<MouseEvent | TouchEvent>)
    expect(state.isPaint).toBe(true)
    expect(state.lastLine).not.toBe(null)

    handleDrawMove(event as Konva.KonvaEventObject<MouseEvent | TouchEvent>)
    expect((state.lastLine as Konva.Line).points).toHaveBeenCalled()

    handleDrawEnd()
    expect(state.isPaint).toBe(false)
    expect(state.historyIndex).toBe(1)
  })
})