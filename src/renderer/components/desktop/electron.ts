// Requires preload.js in cate-desktop:
//
//  import * as electron from 'electron';
//  (window as any).electron = electron;
//
const electron = (window as any).electron || null;

export default electron;