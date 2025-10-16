import { describe, it, expect } from 'vitest'
import { getDistance, getCenter } from './utils'

describe('getDistance', () => {
  it('should return 0 for the same point', () => {
    const p1 = { x: 1, y: 1 }
    expect(getDistance(p1, p1)).toBe(0)
  })

  it('should calculate the distance between two points', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 3, y: 4 }
    expect(getDistance(p1, p2)).toBe(5)
  })
})

describe('getCenter', () => {
  it('should return the same point for the same point', () => {
    const p1 = { x: 1, y: 1 }
    expect(getCenter(p1, p1)).toEqual({ x: 1, y: 1 })
  })

  it('should calculate the center between two points', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 4, y: 4 }
    expect(getCenter(p1, p2)).toEqual({ x: 2, y: 2 })
  })
})
