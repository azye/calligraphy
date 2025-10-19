import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupUIEventListeners } from './events'
import { config, GridMode } from './config'

// Mock DOM elements
const mockGridDropdown = {
  classList: {
    toggle: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(() => false),
  },
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
}

const mockDropdownTrigger = {
  querySelector: vi.fn(),
  addEventListener: vi.fn(),
}

// Mock document methods
Object.defineProperty(document, 'getElementById', {
  value: vi.fn((id: string) => {
    switch (id) {
      case 'grid-dropdown':
        return mockGridDropdown
      case 'discard-canvas-button':
      case 'undo-icon-button':
      case 'redo-icon-button':
      case 'download-icon-button':
        return { addEventListener: vi.fn() }
      default:
        return null
    }
  }),
  writable: true,
})

Object.defineProperty(document, 'querySelectorAll', {
  value: vi.fn(() => []),
  writable: true,
})

Object.defineProperty(document, 'addEventListener', {
  value: vi.fn(),
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock canvas functions
vi.mock('./canvas', () => ({
  renderGridLayer: vi.fn(),
  clearCanvas: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  downloadCanvas: vi.fn(),
}))

describe('events', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset config to basic grid
    config.gridMode = GridMode.Basic

    // Setup default mock returns
    mockGridDropdown.querySelector.mockImplementation((selector: string) => {
      if (selector === '.dropdown-trigger button') {
        return mockDropdownTrigger
      }
      return null
    })

    mockDropdownTrigger.querySelector.mockReturnValue({
      textContent: 'Grid',
    })

    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('setupUIEventListeners', () => {
    it('should initialize dropdown button text with current grid selection', () => {
      // Setup mock to return the current grid item
      mockGridDropdown.querySelector.mockImplementation((selector: string) => {
        if (selector === '.dropdown-trigger button') {
          return mockDropdownTrigger
        }
        if (selector === '[data-grid="basic"]') {
          return { textContent: 'Basic Grid' }
        }
        return null
      })

      mockDropdownTrigger.querySelector.mockReturnValue({
        textContent: 'Grid',
      })

      setupUIEventListeners()

      // Check that the button text was updated to match the current grid
      expect(mockDropdownTrigger.querySelector).toHaveBeenCalledWith('span')
    })

    it('should update dropdown button text when grid option is selected', () => {
      const mockEvent = { preventDefault: vi.fn() }
      const mockButtonText = { textContent: 'Grid' }

      const mockDropdownItem = {
        dataset: { grid: 'basic' },
        textContent: 'Basic Grid',
        addEventListener: vi.fn(),
      }

      mockGridDropdown.querySelector.mockImplementation((selector: string) => {
        if (selector === '.dropdown-trigger button') {
          return mockDropdownTrigger
        }
        if (selector === '[data-grid="basic"]') {
          return { textContent: 'Basic Grid' }
        }
        return null
      })

      mockGridDropdown.querySelectorAll.mockReturnValue([mockDropdownItem] as never[])
      mockDropdownTrigger.querySelector.mockReturnValue(mockButtonText)

      setupUIEventListeners()

      // Get the click handler that was added to the dropdown item
      const addEventListenerCalls = mockDropdownItem.addEventListener.mock.calls
      const clickCall = addEventListenerCalls.find((call) => call[0] === 'click')
      const clickHandler = clickCall?.[1]
      clickHandler(mockEvent)

      expect(mockButtonText.textContent).toBe('Basic Grid')
      expect(config.gridMode).toBe('basic')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('grid-mode', 'basic')
    })

    it('should not update button text if gridType is not valid', () => {
      const mockEvent = { preventDefault: vi.fn() }
      const mockButtonText = { textContent: 'Grid' }

      const invalidGridItem = {
        dataset: { grid: null },
        textContent: 'Invalid Grid',
        addEventListener: vi.fn(),
      }

      mockGridDropdown.querySelectorAll.mockReturnValue([invalidGridItem] as never[])
      mockDropdownTrigger.querySelector.mockReturnValue(mockButtonText)

      setupUIEventListeners()

      const addEventListenerCalls = invalidGridItem.addEventListener.mock.calls
      const clickCall = addEventListenerCalls.find((call) => call[0] === 'click')
      const clickHandler = clickCall?.[1]
      clickHandler(mockEvent)

      expect(mockButtonText.textContent).toBe('Grid') // Should remain unchanged
      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })
  })
})
