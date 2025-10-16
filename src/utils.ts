export interface Point {
  x: number
  y: number
}

export const getDistance = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

export const getCenter = (p1: Point, p2: Point) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

export const reversePointArray = (arr: number[]): number[] => {
  const a = arr[0]
  const b = arr[1]

  arr[0] = arr[2]
  arr[1] = arr[3]
  arr[2] = a
  arr[3] = b

  return arr
}
