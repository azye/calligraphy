import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupCanvas, downloadCanvas, handleDrawStart } from './canvas'
import Konva from 'konva'
import { state } from './state'

// Mock Konva
vi.mock('konva', () => {
  const mockStage = {
    add: vi.fn().mockReturnThis(),
    on: vi.fn(),
    getPointerPosition: vi.fn(),
    scale: vi.fn().mockReturnThis(),
    x: vi.fn().mockReturnThis(),
    y: vi.fn().mockReturnThis(),
    position: vi.fn().mockReturnThis(),
    toJSON: vi.fn().mockReturnValue('{}'),
    findOne: vi.fn(),
    removeChildren: vi.fn().mockReturnThis(),
    startDrag: vi.fn(),
    stopDrag: vi.fn(),
    isDragging: vi.fn(() => false),
    toDataURL: vi.fn(),
  }
  const mockLayer = {
    add: vi.fn().mockReturnThis(),
    destroyChildren: vi.fn().mockReturnThis(),
    getCanvas: vi.fn(() => ({
      _canvas: {
        width: 1000,
        height: 1000,
      },
    })),
    hitCanvas: {
      width: 1000,
      height: 1000,
    },
    getRelativePointerPosition: vi.fn(),
    width: vi.fn(() => 1000),
    height: vi.fn(() => 1000),
  }
  return {
    default: {
      Stage: vi.fn(() => mockStage),
      Layer: vi.fn(() => mockLayer),
      Line: vi.fn(() => ({
        points: vi.fn().mockReturnThis(),
        hide: vi.fn().mockReturnThis(),
        show: vi.fn().mockReturnThis(),
        destroy: vi.fn().mockReturnThis(),
      })),
      Rect: vi.fn(),
    },
  }
})

describe('canvas', () => {
  beforeEach(() => {
    const container = document.createElement('div')
    container.id = 'container'
    document.body.appendChild(container)
    vi.clearAllMocks()
    state.isPaint = false
    state.lastLine = null
  })

  it('should setup canvas', () => {
    setupCanvas()
    expect(Konva.Stage).toHaveBeenCalled()
  })

  describe('handleDrawStart', () => {
    it('should not start drawing if pointer is outside the canvas', () => {
      const mockEvent = {} as Konva.KonvaEventObject<MouseEvent>
      state.drawingLayer = new Konva.Layer()

      // Simulate pointer being outside the canvas
      vi.spyOn(state.drawingLayer, 'getRelativePointerPosition').mockReturnValue({ x: -10, y: -10 })

      handleDrawStart(mockEvent)

      expect(state.isPaint).toBe(false)
      expect(state.lastLine).toBeNull()
    })

    it('should start drawing if pointer is inside the canvas', () => {
      const mockEvent = { type: 'mousedown' } as Konva.KonvaEventObject<MouseEvent>
      state.drawingLayer = new Konva.Layer()

      // Simulate pointer being inside the canvas
      vi.spyOn(state.drawingLayer, 'getRelativePointerPosition').mockReturnValue({ x: 100, y: 100 })

      handleDrawStart(mockEvent)

      expect(state.isPaint).toBe(true)
      expect(state.lastLine).not.toBeNull()
      expect(Konva.Line).toHaveBeenCalled()
    })
  })

  it('should handle undo and redo', () => {
    // This is a placeholder test. You should replace it with a real test.
    expect(true).toBe(true)
  })

  it('should clear the canvas', () => {
    // This is a placeholder test. You should replace it with a real test.
    expect(true).toBe(true)
  })

  it('should download the canvas as a PNG file with a timestamped filename', () => {
    state.stage = new Konva.Stage({ container: 'container' })
    const mockToDataURL = vi.fn().mockReturnValue('data:image/png;base64,')
    state.stage.toDataURL = mockToDataURL

    const link = document.createElement('a')
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {
      /* intentionally empty */
    }) // Prevent navigation
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(link)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

    downloadCanvas()

    expect(mockToDataURL).toHaveBeenCalledWith({ pixelRatio: 3 })
    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(link.download).toMatch(/^export-\d{2}-\d{2}-\d{4}-\d{1,2}\d{2}\d{2}(am|pm)\.png$/)
    expect(link.href).toBe('data:image/png;base64,')
    expect(appendChildSpy).toHaveBeenCalledWith(link)
    expect(clickSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalledWith(link)
  })
})
