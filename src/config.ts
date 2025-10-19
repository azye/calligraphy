export enum GridMode {
  Basic = 'basic',
  Plus = 'plus',
  Cross = 'cross',
  Rice = 'rice',
}

export const config = {
  saveEnabled: localStorage.getItem('save-enabled') !== 'false',
  gridMode: (localStorage.getItem('grid-mode') as GridMode) || GridMode.Basic,
  mode: 'brush',
  scaleBy: 1.05,
}
