import { state } from './state'
import {
  handleDrawStart,
  handleDrawMove,
  handleDrawEnd,
  handleWheel,
  undo,
  redo,
  clearCanvas,
  downloadCanvas,
} from './canvas'

export const setupEventListeners = () => {
  state.stage.on('mousedown touchstart', handleDrawStart)
  state.stage.on('mousemove touchmove', handleDrawMove)
  state.stage.on('mouseup touchend', handleDrawEnd)
  state.stage.on('wheel', handleWheel)
}

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

export const setupUIEventListeners = () => {
  const deleteIconButton = document.getElementById('discard-canvas-button')
  deleteIconButton?.addEventListener('click', clearCanvas)

  const undoIconButton = document.getElementById('undo-icon-button')
  undoIconButton?.addEventListener('click', undo)

  const redoIconButton = document.getElementById('redo-icon-button')
  redoIconButton?.addEventListener('click', redo)

  const downloadIconButton = document.getElementById('download-icon-button')
  downloadIconButton?.addEventListener('click', downloadCanvas)
}
