import { describe, it, expect, vi, beforeEach } from 'vitest'
import Konva from 'konva'
import {
  renderGridBorder,
  renderBasicGrid,
  renderPlusGrid,
  renderCrossGrid,
  renderGrid,
  renderRiceGrid,
} from '../src/grids' // Adjusted import path

// Mock Konva
vi.mock('konva', () => {
  const mockLine = vi.fn().mockImplementation((config) => ({
    ...config,
    add: vi.fn(),
  }))

  const mockGroup = vi.fn().mockImplementation(() => ({
    add: vi.fn(),
  }))

  const Konva = {
    Line: mockLine,
    Group: mockGroup,
    Layer: vi.fn(() => ({
      add: vi.fn(),
      hitCanvas: {
        width: 800,
        height: 600,
      },
    })),
  }
  return { default: Konva }
})

// Type the mocked functions
const MockedKonva = Konva as typeof Konva & {
  Line: ReturnType<typeof vi.fn>
  Group: ReturnType<typeof vi.fn>
}

describe('grids', () => {
  let mockLayer: Konva.Layer

  beforeEach(() => {
    vi.clearAllMocks()
    mockLayer = new Konva.Layer()
  })

  describe('renderGridBorder', () => {
    it('should add a Konva.Line to the layer', () => {
      renderGridBorder(mockLayer)
      expect(mockLayer.add).toHaveBeenCalledWith(expect.any(Object))
      expect(Konva.Line).toHaveBeenCalledTimes(1)
    })

    it('should configure the border line with correct properties', () => {
      renderGridBorder(mockLayer)
      const lineConfig = MockedKonva.Line.mock.calls[0][0]
      expect(lineConfig.stroke).toBe('black')
      expect(lineConfig.strokeWidth).toBe(3)
      expect(lineConfig.closed).toBe(true)
      expect(lineConfig.points).toEqual(expect.any(Array))
      expect(lineConfig.points.length).toBe(10) // 5 points (x,y) * 2
    })
  })

  describe('renderBasicGrid', () => {
    it('should add correct number of Konva.Line objects to the layer for default size', () => {
      renderBasicGrid(mockLayer)
      // For a 800x600 canvas with CELL_SIZE 75 and BUFFER 20
      // gridCols = floor((800 - 40) / 75) = floor(760 / 75) = 10
      // gridRows = floor((600 - 40) / 75) = floor(560 / 75) = 7
      // Lines = (gridCols - 1) + (gridRows - 1) = 9 + 6 = 15
      expect(Konva.Line).toHaveBeenCalledTimes(15)
      expect(mockLayer.add).toHaveBeenCalledTimes(15)
    })

    it('should configure basic grid lines with correct properties', () => {
      renderBasicGrid(mockLayer)
      // Check properties of one of the lines (e.g., the first one)
      const lineConfig = MockedKonva.Line.mock.calls[0][0]
      expect(lineConfig.stroke).toBe('black')
      expect(lineConfig.strokeWidth).toBe(2)
    })

    it('should handle small canvas size with no grid lines', () => {
      mockLayer.hitCanvas.width = 50
      mockLayer.hitCanvas.height = 50
      renderBasicGrid(mockLayer)
      expect(Konva.Line).not.toHaveBeenCalled()
      expect(mockLayer.add).not.toHaveBeenCalled()
    })
  })

  describe('renderPlusGrid', () => {
    it('should add correct number of Konva.Line objects to the layer for default size', () => {
      renderPlusGrid(mockLayer)
      // gridCols = 10, gridRows = 7
      // Lines = gridRows + gridCols = 7 + 10 = 17
      expect(Konva.Line).toHaveBeenCalledTimes(17)
      expect(mockLayer.add).toHaveBeenCalledTimes(17)
    })

    it('should configure plus grid lines with correct properties', () => {
      renderPlusGrid(mockLayer)
      const lineConfig = MockedKonva.Line.mock.calls[0][0]
      expect(lineConfig.stroke).toBe('black')
      expect(lineConfig.strokeWidth).toBe(1)
      expect(lineConfig.dash).toEqual([1, 1])
    })
  })

  describe('renderCrossGrid', () => {
    it('should add a Konva.Group to the layer', () => {
      renderCrossGrid(mockLayer)
      expect(mockLayer.add).toHaveBeenCalledWith(expect.any(Object))
      expect(Konva.Group).toHaveBeenCalledTimes(1)
    })

    it('should add multiple Konva.Line objects to the group with correct properties', () => {
      renderCrossGrid(mockLayer)
      const groupInstance = MockedKonva.Group.mock.results[0].value
      expect(MockedKonva.Line.mock.calls.length).toBeGreaterThan(20) // A more specific lower bound
      expect(groupInstance.add.mock.calls.length).toBeGreaterThan(20) // A more specific lower bound

      // Check properties of one of the lines added to the group
      const lineConfig = MockedKonva.Line.mock.calls[0][0]
      expect(lineConfig.stroke).toBe('black')
      expect(lineConfig.strokeWidth).toBe(1)
      expect(lineConfig.dash).toEqual([1, 1])
    })
  })

  describe('renderGrid', () => {
    it('should call renderGridBorder and renderBasicGrid internally', () => {
      renderGrid(mockLayer)
      // renderGridBorder creates 1 line
      // renderBasicGrid creates 15 lines
      // Total lines = 1 + 15 = 16
      expect(Konva.Line).toHaveBeenCalledTimes(16)
      expect(mockLayer.add).toHaveBeenCalledTimes(16)
    })
  })

  describe('renderRiceGrid', () => {
    it('should call renderGridBorder, renderBasicGrid, renderCrossGrid, and renderPlusGrid internally', () => {
      renderRiceGrid(mockLayer)
      // Reset mocks to get accurate counts for this specific test
      vi.clearAllMocks()
      mockLayer = new Konva.Layer() // Re-initialize mockLayer to clear previous calls

      renderRiceGrid(mockLayer)

      // renderGridBorder: 1 line
      // renderBasicGrid: 15 lines
      // renderPlusGrid: 17 lines
      // renderCrossGrid: creates lines within a group, and adds the group to the layer.
      // Konva.Line calls will be sum of all internal calls.
      // Konva.Group will be called once by renderCrossGrid.
      // mockLayer.add will be called for renderGridBorder, renderBasicGrid, renderPlusGrid, and the group from renderCrossGrid.

      // Check total Konva.Line creations
      expect(MockedKonva.Line.mock.calls.length).toBeGreaterThan(1 + 15 + 17) // At least sum of known lines

      // Check Konva.Group creation (once for renderCrossGrid)
      expect(Konva.Group).toHaveBeenCalledTimes(1)

      // Check mockLayer.add calls
      // 1 (border) + 15 (basic) + 17 (plus) + 1 (group from cross) = 34
      expect(mockLayer.add).toHaveBeenCalledTimes(34)
    })
  })
})
