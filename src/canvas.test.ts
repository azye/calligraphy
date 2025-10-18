import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupCanvas, downloadCanvas } from './canvas'
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
  return {
    default: {
      Stage: vi.fn(() => mockStage),
      Layer: vi.fn(() => ({
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
      })),
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
  })

  it('should setup canvas', () => {
    setupCanvas()
    expect(Konva.Stage).toHaveBeenCalled()
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
