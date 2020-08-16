/**
 * Used to parse users' text inputs into normalized paths and to format normalized paths into user text outputs.
 * Values are according to output of Python's platform.system() call.
 */
export type HostOS = 'Windows' | 'Linux' | 'Java';


export function isAbsolutePath(path: string, hostOS?: HostOS) {
    if (hostOS === 'Windows') {
        return isWindowsRootPath(path) || isLinuxRootPath(path);
    } else {
        return isLinuxRootPath(path);
    }
}

export function isLinuxRootPath(path: string): boolean {
    return path.startsWith('/');
}

export function isWindowsRootPath(path: string): boolean {
    return isWindowsNetworkDevicePath(path) || isWindowsDrivePath(path);
}

export function isWindowsNetworkDevicePath(path: string): boolean {
    return path.startsWith('//') || path.startsWith('\\\\');
}

export function isWindowsDrivePath(path: string): boolean {
    return path.length >= 2
           && /^[a-z]+$/i.test(path[0])
           && path[1] === ':'
           && (path.length === 2 || path[2] === '/' || path[2] === '\\');
}

/**
 * Make `path2` absolute with respect to absolute (directory) path `path1`.
 * `path1` must be absolute and `path2` must be relative, otherwise the
 * result is not defined.
 *
 * @param path1 first absolute path
 * @param path2 second relative path
 * @param hostOS host OS identifier
 * @returns `path1` relative to `path2`.
 */
export function makeAbsolutePath(path1: string, path2: string, hostOS?: HostOS): string {
    let comps1 = splitPath(path1, hostOS);
    let comps2 = splitPath(path2, hostOS);
    if (comps1.length > 0 && comps1[comps1.length - 1] === '') {
        comps1 = comps1.slice(0, comps1.length - 1);
    }
    if (comps2.length > 0 && comps2[0] === '') {
        comps2 = comps2.slice(1);
    }
    return joinPathComponents(normPathComponents(comps1.concat(comps2)), hostOS);
}

/**
 * Make `path1` relative to another (directory) path `path2`.
 * Both paths must be either relative or absolute, otherwise the
 * result is not defined.
 *
 * @param path1 first path
 * @param path2 second path
 * @param hostOS host OS identifier
 * @returns `path1` relative to `path2`.
 */
export function makeRelativePath(path1: string, path2: string, hostOS?: HostOS): string {
    if (path1 === '' || path1 === path2) {
        return "";
    }
    const comps1 = splitPath(path1, hostOS);
    const comps2 = splitPath(path2, hostOS);
    let n1 = comps1.length;
    let n2 = comps2.length;
    let n = Math.max(n1, n2);
    let iFirstDiff = Math.min(n1, n2);
    for (let i = 0; i < n; i++) {
        if (i < n1 && i < n2) {
            let comp1 = comps1[i];
            let comp2 = comps2[i];
            if (comp1 !== comp2) {
                iFirstDiff = i;
                break;
            }
        }
    }
    if (iFirstDiff === n) {
        return '';
    }
    let relPathComps: string[];
    if (n2 > iFirstDiff) {
        relPathComps = new Array<string>(n2 - iFirstDiff).fill('..');
    } else {
        relPathComps = [];
    }
    if (n1 > iFirstDiff) {
        relPathComps = relPathComps.concat(comps1.slice(iFirstDiff));
    }
    return relPathComps.join('/');
}

/**
 * Normalizes `path`. Removes '.', '..', end trailing file separators.
 * @param path the path
 * @param hostOS host OS identifier
 * @returns a normalized path
 */
export function normPath(path: string, hostOS?: HostOS): string {
    return joinPathComponents(normPathComponents(splitPath(path, hostOS), hostOS));
}

// noinspection JSUnusedLocalSymbols
/**
 * Normalizes path `components`. Removes '.', '..', end trailing empty strings.
 * @param components the path components
 * @param hostOS host OS identifier
 * @returns a normalized path components
 */
export function normPathComponents(components: string[], hostOS?: HostOS): string[] {
    const newComponents = Array<string>(components.length);
    let insPos = 0;
    for (let i = 0; i < components.length; i++) {
        const component = components[i];
        if (component === '.') {
            // No-op
        } else if (component === '..') {
            insPos--;
        } else {
            if (insPos < 0) {
                // Cannot normalize
                return components;
            }
            newComponents[insPos] = component;
            insPos++;
        }
    }
    if (insPos < 0) {
        // Cannot normalize
        return components;
    }
    return newComponents.slice(0, insPos);
}

/**
 * Join path components.
 * @param components the path components
 * @param hostOS host OS identifier
 * @returns a path
 */
export function joinPathComponents(components: string[], hostOS?: HostOS): string {
    return components.join(hostOS === 'Windows' ? '\\' : '/');
}

/**
 * Split path into path components.
 * @param path a path
 * @param hostOS host OS identifier
 * @returns the path's components
 */
export function splitPath(path: string, hostOS?: HostOS): string[] {
    if (hostOS === 'Windows') {
        if (isWindowsNetworkDevicePath(path) || isWindowsDrivePath(path)) {
            const components = splitPath(path.substring(2));
            if (components.length === 0) {
                return components;
            }
            return [path.substr(0, 2) + components[0]].concat(components.slice(1));
        }
        return path.split(/[/\\]/);
    }
    return path.split('/');
}

/**
 * Get the parent dir of path `path`.
 * @param path a path
 * @param hostOS host OS identifier
 * @returns the path's parent path
 */
export function getParentPath(path: string, hostOS?: HostOS): string {
    const components = splitPath(path, hostOS);
    return components.length > 0
           ? joinPathComponents(components.slice(0, components.length - 1), hostOS)
           : '';
}

/**
 * Get the basename of `path`.
 * @param path a path
 * @param hostOS host OS identifier
 * @returns the path's basename
 */
export function getBasename(path: string, hostOS?: HostOS): string {
    const components = splitPath(path, hostOS);
    return components.length > 0
           ? components[components.length - 1]
           : path;
}

/**
 * Get filename extension
 * @param basename the filename (a name, not a path!)
 */
export function getBasenameExtension(basename: string): string {
    const index = basename.lastIndexOf('.');
    if (index > 0) {
        return basename.substring(index + 1);
    }
    return '';
}