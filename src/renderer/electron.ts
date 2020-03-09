// https://github.com/electron/electron/issues/2288
let _isElectron = typeof navigator === 'object'
                  && typeof navigator.userAgent === 'string'
                  && navigator.userAgent.toLowerCase().indexOf(' electron/') >= 0;

export function isElectron() {
    return _isElectron;
}

console.log('isElectron? ', isElectron());

export function requireElectron(): any | null {
    let electron;
    try {
        electron = require('electron');
    } catch (error) {
        electron = null;
    }
    return electron;
}
