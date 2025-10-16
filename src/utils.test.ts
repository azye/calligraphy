import { describe, it, expect } from 'vitest';
import { getDistance, getCenter } from './utils';

describe('getDistance', () => {
  it('should return 0 for the same point', () => {
    const p1 = { x: 1, y: 1 };
    expect(getDistance(p1, p1)).toBe(0);
  });

  it('should calculate the distance between two points (positive coordinates)', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(getDistance(p1, p2)).toBe(5);
  });

  it('should calculate the distance between two points (negative coordinates)', () => {
    const p1 = { x: -1, y: -1 };
    const p2 = { x: -4, y: -5 };
    expect(getDistance(p1, p2)).toBe(5); // sqrt((-4 - -1)^2 + (-5 - -1)^2) = sqrt((-3)^2 + (-4)^2) = sqrt(9 + 16) = sqrt(25) = 5
  });

  it('should calculate the distance between two points (mixed coordinates)', () => {
    const p1 = { x: -1, y: 1 };
    const p2 = { x: 2, y: 5 };
    expect(getDistance(p1, p2)).toBe(5); // sqrt((2 - -1)^2 + (5 - 1)^2) = sqrt(3^2 + 4^2) = sqrt(9 + 16) = sqrt(25) = 5
  });

  it('should calculate the distance between two points (floating-point coordinates)', () => {
    const p1 = { x: 0.5, y: 0.5 };
    const p2 = { x: 3.5, y: 4.5 };
    expect(getDistance(p1, p2)).toBeCloseTo(5); // sqrt((3.5 - 0.5)^2 + (4.5 - 0.5)^2) = sqrt(3^2 + 4^2) = 5
  });

  it('should calculate the distance between two points (large coordinates)', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 30000, y: 40000 };
    expect(getDistance(p1, p2)).toBe(50000);
  });
});

describe('getCenter', () => {
  it('should return the same point for the same point', () => {
    const p1 = { x: 1, y: 1 };
    expect(getCenter(p1, p1)).toEqual({ x: 1, y: 1 });
  });

  it('should calculate the center between two points (positive coordinates)', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 4, y: 4 };
    expect(getCenter(p1, p2)).toEqual({ x: 2, y: 2 });
  });

  it('should calculate the center between two points (negative coordinates)', () => {
    const p1 = { x: -2, y: -2 };
    const p2 = { x: -4, y: -4 };
    expect(getCenter(p1, p2)).toEqual({ x: -3, y: -3 });
  });

  it('should calculate the center between two points (mixed coordinates)', () => {
    const p1 = { x: -2, y: 2 };
    const p2 = { x: 4, y: -4 };
    expect(getCenter(p1, p2)).toEqual({ x: 1, y: -1 });
  });

  it('should calculate the center between two points (floating-point coordinates)', () => {
    const p1 = { x: 0.5, y: 1.5 };
    const p2 = { x: 1.5, y: 2.5 };
    expect(getCenter(p1, p2)).toEqual({ x: 1, y: 2 });
  });

  it('should calculate the center between two points (large coordinates)', () => {
    const p1 = { x: 10000, y: 20000 };
    const p2 = { x: 30000, y: 40000 };
    expect(getCenter(p1, p2)).toEqual({ x: 20000, y: 30000 });
  });
});