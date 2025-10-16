export enum GridMode {
  Grid = 1,
  Rice,
}

export const config = {
  saveEnabled: localStorage.getItem('save-enabled') !== 'false',
  gridMode: localStorage.getItem('grid-mode') !== 'rice' ? GridMode.Grid : GridMode.Rice,
  mode: 'brush',
  scaleBy: 1.05,
}
