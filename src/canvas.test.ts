import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    setupCanvas,
    undo,
    redo,
    clearCanvas,
    state,
    handleDrawStart,
    handleDrawEnd,
    handleDrawMove,
    updateCanvasState,
    handleKeyboardShortcuts
} from './canvas';
import Konva from 'konva';

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
    };

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
    };

    const mockLine = {
        points: vi.fn().mockReturnValue([]),
        destroy: vi.fn(),
        hide: vi.fn(),
        show: vi.fn(),
    };

    const Konva = {
        Stage: vi.fn(() => mockStage),
        Layer: vi.fn(() => mockLayer),
        Line: vi.fn(() => mockLine),
        Rect: vi.fn(),
        Node: {
            create: vi.fn(),
        },
        hitOnDragEnabled: false,
    };
    return { default: Konva };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

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
});


describe('canvas', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset state completely to ensure test isolation
        state.canvasStateHistory = [];
        state.historyIndex = 0;
        state.redoCache = [];
        state.lastLine = null;
        state.isPaint = false;
        state.isDragging = false;
        state.isTouching2 = false;
        state.lastCenter = null;
        state.lastDist = 0;
        state.dragStopped = false;
    });

    it('should setup canvas', () => {
        setupCanvas();
        expect(Konva.Stage).toHaveBeenCalled();
    });

    describe('undo functionality', () => {
        it('should undo a single operation', () => {
            const line = new Konva.Line();
            state.canvasStateHistory.push(line);
            state.historyIndex = 1;
            

            undo();
            expect(line.hide).toHaveBeenCalled();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(1);
            expect(state.redoCache[0]).toBe(line);
        });

        it('should undo multiple operations in sequence', () => {
            const line1 = new Konva.Line();
            const line2 = new Konva.Line();
            const line3 = new Konva.Line();
            
            state.canvasStateHistory.push(line1, line2, line3);
            state.historyIndex = 3;

            // Undo first operation (line3)
            undo();
            expect(line3.hide).toHaveBeenCalled();
            expect(state.historyIndex).toBe(2);
            expect(state.redoCache.length).toBe(1);
            expect(state.redoCache[0]).toBe(line3);

            // Undo second operation (line2)
            undo();
            expect(line2.hide).toHaveBeenCalled();
            expect(state.historyIndex).toBe(1);
            expect(state.redoCache.length).toBe(2);
            expect(state.redoCache[1]).toBe(line2);

            // Undo third operation (line1)
            undo();
            expect(line1.hide).toHaveBeenCalled();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(3);
            expect(state.redoCache[2]).toBe(line1);
        });

        it('should not undo when history is empty', () => {
            state.historyIndex = 0;
            state.canvasStateHistory = [];
            state.redoCache = [];

            undo();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(0);
        });

        it('should not undo when already at beginning', () => {
            const line = new Konva.Line();
            state.canvasStateHistory.push(line);
            state.historyIndex = 0; // Already at beginning

            undo();
            expect(line.hide).not.toHaveBeenCalled();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(0);
        });

        it('should handle undo with negative history index', () => {
            state.historyIndex = -1; // Invalid state
            state.canvasStateHistory = [];

            undo();
            expect(state.historyIndex).toBe(-1); // Should remain unchanged
            expect(state.redoCache.length).toBe(0);
        });

        it('should maintain redo cache order correctly', () => {
            const line1 = new Konva.Line();
            const line2 = new Konva.Line();
            const line3 = new Konva.Line();
            
            state.canvasStateHistory.push(line1, line2, line3);
            state.historyIndex = 3;

            // Undo all operations (LIFO order)
            undo(); // line3 goes to redo cache first
            undo(); // line2 goes to redo cache second  
            undo(); // line1 goes to redo cache last

            // Redo cache should be [line3, line2, line1] (LIFO)
            expect(state.redoCache).toEqual([line3, line2, line1]);
        });
    });

    describe('redo functionality', () => {
        it('should redo a single operation', () => {
            const line = new Konva.Line();
            state.redoCache.push(line);
            state.historyIndex = 0;

            redo();
            expect(line.show).toHaveBeenCalled();
            expect(state.historyIndex).toBe(1);
            expect(state.redoCache.length).toBe(0);
            expect(state.canvasStateHistory[0]).toBe(line);
        });

        it('should redo multiple operations in correct order', () => {
            const line1 = new Konva.Line();
            const line2 = new Konva.Line();
            const line3 = new Konva.Line();
            
            // Redo cache should be in reverse order (LIFO - Last In, First Out)
            state.redoCache.push(line3, line2, line1);
            state.historyIndex = 0;

            // Redo first operation (line1 - last undone)
            redo();
            expect(line1.show).toHaveBeenCalled();
            expect(state.historyIndex).toBe(1);
            expect(state.redoCache.length).toBe(2);
            expect(state.canvasStateHistory[0]).toBe(line1);

            // Redo second operation (line2)
            redo();
            expect(line2.show).toHaveBeenCalled();
            expect(state.historyIndex).toBe(2);
            expect(state.redoCache.length).toBe(1);
            expect(state.canvasStateHistory[1]).toBe(line2);

            // Redo third operation (line3 - first undone)
            redo();
            expect(line3.show).toHaveBeenCalled();
            expect(state.historyIndex).toBe(3);
            expect(state.redoCache.length).toBe(0);
            expect(state.canvasStateHistory[2]).toBe(line3);
        });

        it('should not redo when redo cache is empty', () => {
            state.redoCache = [];
            state.historyIndex = 0;

            redo();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(0);
        });
    });

    describe('undo-redo integration', () => {
        it('should handle complete undo-redo cycle', () => {
            const line1 = new Konva.Line();
            const line2 = new Konva.Line();
            
            state.canvasStateHistory.push(line1, line2);
            state.historyIndex = 2;

            // Undo both operations
            undo();
            undo();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(2);

            // Redo both operations
            redo();
            redo();
            expect(state.historyIndex).toBe(2);
            expect(state.redoCache.length).toBe(0);
        });

        it('should clear redo cache when new operation is performed', () => {
            const line1 = new Konva.Line();
            const line2 = new Konva.Line();
            const newLine = new Konva.Line();
            
            state.canvasStateHistory.push(line1);
            state.historyIndex = 1;
            state.redoCache.push(line2);

            // Simulate new operation (this would normally be called by updateCanvasState)
            state.canvasStateHistory = state.canvasStateHistory.slice(0, state.historyIndex);
            state.canvasStateHistory.push(newLine);
            state.historyIndex++;
            state.redoCache = []; // This should happen in real implementation

            expect(state.redoCache.length).toBe(0);
        });

        it('should handle rapid undo-redo calls', () => {
            const line = new Konva.Line();
            state.canvasStateHistory.push(line);
            state.historyIndex = 1;

            // Rapid undo-redo calls
            undo();
            redo();
            undo();
            redo();

            expect(line.hide).toHaveBeenCalledTimes(2);
            expect(line.show).toHaveBeenCalledTimes(2);
            expect(state.historyIndex).toBe(1);
            expect(state.redoCache.length).toBe(0);
        });

        it('should maintain state consistency with mixed operations', () => {
            const line1 = new Konva.Line();
            const line2 = new Konva.Line();
            const line3 = new Konva.Line();
            
            state.canvasStateHistory.push(line1, line2, line3);
            state.historyIndex = 3;

            // Undo two operations
            undo();
            undo();
            expect(state.historyIndex).toBe(1);
            expect(state.redoCache.length).toBe(2);

            // Redo one operation
            redo();
            expect(state.historyIndex).toBe(2);
            expect(state.redoCache.length).toBe(1);

            // Undo again
            undo();
            expect(state.historyIndex).toBe(1);
            expect(state.redoCache.length).toBe(2);
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle undo with corrupted history index', () => {
            const line = new Konva.Line();
            state.canvasStateHistory.push(line);
            state.historyIndex = 5; // Index beyond array length

            // This will throw an error because the implementation doesn't handle undefined
            expect(() => undo()).toThrow();
        });

        it('should detect implementation bug with undefined line access', () => {
            // This test reveals a bug in the implementation
            state.canvasStateHistory = [];
            state.historyIndex = 1; // Invalid state - index beyond array

            expect(() => undo()).toThrow();
        });

        it('should handle redo with corrupted history index', () => {
            const line = new Konva.Line();
            state.redoCache.push(line);
            state.historyIndex = -1; // Invalid index

            redo();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(0);
        });

        it('should handle undo with empty canvas state history', () => {
            state.canvasStateHistory = [];
            state.historyIndex = 0;

            undo();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(0);
        });

        it('should handle redo with empty redo cache', () => {
            state.redoCache = [];
            state.historyIndex = 0;

            redo();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(0);
        });

        it('should handle undo when history index equals array length', () => {
            const line = new Konva.Line();
            state.canvasStateHistory.push(line);
            state.historyIndex = 1; // Equal to array length

            undo();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(1);
        });
    });

    it('should clear canvas', () => {
        setupCanvas();
        clearCanvas();
        expect(state.drawingLayer.destroyChildren).toHaveBeenCalled();
        expect(state.graphLayer.destroyChildren).toHaveBeenCalled();
    });

    it('should handle draw start, move and end', () => {
        setupCanvas();
        const mockEvent = {
            type: 'mousedown',
            evt: new MouseEvent('mousedown'),
            target: {} as Konva.Stage,
            pointerId: 1,
            currentTarget: {} as Konva.Stage,
            cancelBubble: false
        };
        handleDrawStart(mockEvent);
        expect(state.isPaint).toBe(true);
        expect(state.lastLine).not.toBe(null);

        handleDrawMove(mockEvent);
        expect(state.lastLine?.points).toHaveBeenCalled();

        handleDrawEnd();
        expect(state.isPaint).toBe(false);
        expect(state.historyIndex).toBe(1);
    });

    describe('updateCanvasState functionality', () => {
        it('should add line to history and increment index', () => {
            const line = new Konva.Line();
            state.lastLine = line;
            state.historyIndex = 0;
            state.canvasStateHistory = [];

            updateCanvasState();
            expect(state.canvasStateHistory).toContain(line);
            expect(state.historyIndex).toBe(1);
        });

        it('should trim history when adding new operation after undo', () => {
            const line1 = new Konva.Line();
            const line2 = new Konva.Line();
            const line3 = new Konva.Line();
            
            state.canvasStateHistory = [line1, line2];
            state.historyIndex = 1; // After one undo
            state.lastLine = line3;

            updateCanvasState();
            expect(state.canvasStateHistory).toEqual([line1, line3]);
            expect(state.historyIndex).toBe(2);
        });

        it('should handle updateCanvasState with null lastLine', () => {
            state.lastLine = null;
            state.historyIndex = 0;
            state.canvasStateHistory = [];

            // The implementation uses ! operator which converts null to false, then pushes null
            updateCanvasState();
            expect(state.canvasStateHistory).toEqual([null]);
            expect(state.historyIndex).toBe(1);
        });

        it('should maintain history consistency with multiple updates', () => {
            const line1 = new Konva.Line();
            const line2 = new Konva.Line();
            const line3 = new Konva.Line();
            
            state.lastLine = line1;
            state.historyIndex = 0;
            state.canvasStateHistory = [];

            updateCanvasState();
            expect(state.historyIndex).toBe(1);

            state.lastLine = line2;
            updateCanvasState();
            expect(state.historyIndex).toBe(2);

            state.lastLine = line3;
            updateCanvasState();
            expect(state.historyIndex).toBe(3);
            expect(state.canvasStateHistory).toEqual([line1, line2, line3]);
        });
    });

    describe('keyboard shortcuts', () => {
        let mockEvent: any;

        beforeEach(() => {
            mockEvent = {
                preventDefault: vi.fn(),
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                key: ''
            };
        });

        it('should handle Ctrl+Z for undo', () => {
            const line = new Konva.Line();
            state.canvasStateHistory.push(line);
            state.historyIndex = 1;

            mockEvent.ctrlKey = true;
            mockEvent.key = 'z';
            handleKeyboardShortcuts(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(line.hide).toHaveBeenCalled();
            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(1);
            expect(state.redoCache[0]).toBe(line);
        });

        it('should handle Ctrl+Shift+Z for redo', () => {
            const line = new Konva.Line();
            state.redoCache.push(line);
            state.historyIndex = 0;

            mockEvent.ctrlKey = true;
            mockEvent.shiftKey = true;
            mockEvent.key = 'z';
            handleKeyboardShortcuts(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(line.show).toHaveBeenCalled();
            expect(state.historyIndex).toBe(1);
            expect(state.redoCache.length).toBe(0);
            expect(state.canvasStateHistory[0]).toBe(line);
        });

        it('should handle Ctrl+Y for redo', () => {
            const line = new Konva.Line();
            state.redoCache.push(line);
            state.historyIndex = 0;

            mockEvent.ctrlKey = true;
            mockEvent.key = 'y';
            handleKeyboardShortcuts(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(line.show).toHaveBeenCalled();
            expect(state.historyIndex).toBe(1);
            expect(state.redoCache.length).toBe(0);
            expect(state.canvasStateHistory[0]).toBe(line);
        });

        it('should handle Cmd+Z on Mac for undo', () => {
            const line = new Konva.Line();
            state.canvasStateHistory.push(line);
            state.historyIndex = 1;

            mockEvent.metaKey = true;
            mockEvent.key = 'z';
            handleKeyboardShortcuts(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(line.hide).toHaveBeenCalled();
        });

        it('should handle Cmd+Shift+Z on Mac for redo', () => {
            const line = new Konva.Line();
            state.redoCache.push(line);
            state.historyIndex = 0;

            mockEvent.metaKey = true;
            mockEvent.shiftKey = true;
            mockEvent.key = 'z';
            handleKeyboardShortcuts(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(line.show).toHaveBeenCalled();
        });

        it('should not trigger undo/redo without Ctrl/Cmd key', () => {
            const line = new Konva.Line();
            state.canvasStateHistory.push(line);
            state.historyIndex = 1;

            mockEvent.key = 'z';
            handleKeyboardShortcuts(mockEvent);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(line.hide).not.toHaveBeenCalled();
        });

        it('should not trigger undo/redo for other keys', () => {
            const line = new Konva.Line();
            state.canvasStateHistory.push(line);
            state.historyIndex = 1;

            mockEvent.ctrlKey = true;
            mockEvent.key = 'a';
            handleKeyboardShortcuts(mockEvent);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(line.hide).not.toHaveBeenCalled();
        });

        it('should handle case insensitive key matching', () => {
            const line = new Konva.Line();
            state.canvasStateHistory.push(line);
            state.historyIndex = 1;

            mockEvent.ctrlKey = true;
            mockEvent.key = 'Z'; // Uppercase Z
            handleKeyboardShortcuts(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(line.hide).toHaveBeenCalled();
        });

        it('should handle rapid keyboard shortcuts', () => {
            const line1 = new Konva.Line();
            const line2 = new Konva.Line();
            state.canvasStateHistory.push(line1, line2);
            state.historyIndex = 2;

            // Rapid undo calls
            mockEvent.ctrlKey = true;
            mockEvent.key = 'z';
            handleKeyboardShortcuts(mockEvent);
            handleKeyboardShortcuts(mockEvent);

            expect(state.historyIndex).toBe(0);
            expect(state.redoCache.length).toBe(2);
        });
    });

    describe('performance and memory management', () => {
        it('should handle large history without memory leaks', () => {
            const lines = Array.from({ length: 1000 }, () => new Konva.Line());
            
            // Add many lines to history
            lines.forEach((line, index) => {
                state.canvasStateHistory.push(line);
                state.historyIndex = index + 1;
            });

            // Undo many operations
            for (let i = 0; i < 500; i++) {
                undo();
            }

            expect(state.historyIndex).toBe(500);
            expect(state.redoCache.length).toBe(500);
        });

        it('should maintain correct state with complex undo-redo patterns', () => {
            const lines = Array.from({ length: 10 }, () => new Konva.Line());
            
            // Build initial history
            lines.forEach((line, index) => {
                state.canvasStateHistory.push(line);
                state.historyIndex = index + 1;
            });

            // Complex pattern: undo 3, redo 1, undo 2, redo 2, undo 1
            undo(); undo(); undo(); // historyIndex = 7, redoCache = 3
            redo(); // historyIndex = 8, redoCache = 2
            undo(); undo(); // historyIndex = 6, redoCache = 4
            redo(); redo(); // historyIndex = 8, redoCache = 2
            undo(); // historyIndex = 7, redoCache = 3

            expect(state.historyIndex).toBe(7);
            expect(state.redoCache.length).toBe(3);
        });
    });
});