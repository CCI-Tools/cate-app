declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        electron?: any;
    }
}

export function isElectron() {
    return Boolean(window.electron);
}

export function requireElectron(): any | null {
    return window.electron || null;
}

if (isElectron()) {
    console.debug('We are running on Electron :)');
}
