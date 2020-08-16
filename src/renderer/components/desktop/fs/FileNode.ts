import {IconName} from '@blueprintjs/core';

import {isNumber, isString} from '../../../../common/types';
import {FileFilter} from '../types';


/**
 * Used to parse users' text inputs into normalized paths and to format normalized paths into user text outputs.
 * Values are according to output of Python's platform.system() call.
 */
export type HostOS = 'Windows' | 'Linux' | 'Java';

/**
 * Represents the current update status of a file node.
 */
export type FileNodeStatus = 'updating' | 'ready' | 'error';

/**
 * A file node represent a file or directory in a file system.
 * When we create path strings from file node paths (hence FileNode[]),
 * we concatenate always by forward slashes ("/"), even if the server file system
 * is Windows OS. Therefore path strings ever start with a "/", even absolute paths.
 */
export interface FileNode {
    /**
     * Name of the file or directory. The root node's name is the empty string.
     */
    name: string;
    /**
     * Date-time of last modification.
     */
    lastModified?: string;
    /**
     * Size in bytes
     */
    size?: number;
    /**
     * True, if this node represents a directory
     */
    isDir: boolean;
    /**
     * Child nodes of the directory
     */
    childNodes?: FileNode[];
    /**
     * The node's update status.
     * If status === undefined means, we have not updated this node yet (i.e. children not fetched)
     */
    status?: FileNodeStatus;
    /**
     * Detail message if status === "error"
     */
    message?: string;
}

export const ALL_FILES_FILTER = {name: "All files", extensions: ["*"]};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FileNode operations

/**
 * Returns a new `rootNode` where `updatedFileNode` is inserted at position given by `path`.
 * @param rootNode the root node
 * @param path normalized path
 * @param updatedFileNode the file node update that will replace the old one
 */
export function updateFileNode(rootNode: FileNode, path: string, updatedFileNode: FileNode): FileNode {
    if (path === '') {
        return {...rootNode, ...updatedFileNode, status: 'ready'};
    }
    return _updateFileNode(rootNode, path.split('/'), updatedFileNode);
}

function _updateFileNode(rootNode: FileNode, path: string[], updatedFileNode: FileNode): FileNode {
    if (!rootNode.childNodes) {
        // can't work without child nodes
        console.error('_updateFileNode: root node without child nodes');
        return rootNode;
    }
    updatedFileNode = !updatedFileNode.status ? {...updatedFileNode, status: 'ready'} : updatedFileNode;
    const newRootNode: FileNode = {...rootNode, childNodes: [...rootNode.childNodes]};
    let currentNode: FileNode = newRootNode;
    for (let depth = 0; depth < path.length; depth++) {
        if (!currentNode.childNodes) {
            console.error(`_updateFileNode: no child nodes at index ${depth} in "${path.join('/')}"`);
            return rootNode;
        }
        const name = path[depth];
        const childIndex = currentNode.childNodes.findIndex(n => name.localeCompare(n.name) === 0);
        if (childIndex < 0) {
            console.error(`_updateFileNode: invalid path component "${name}" at index ${depth} in "${path.join('/')}"`);
            return rootNode;
        }
        if (depth === path.length - 1) {
            currentNode.childNodes[childIndex] = updatedFileNode;
        } else {
            const childNode = currentNode.childNodes[childIndex];
            let newChildNode;
            if (childNode.childNodes) {
                newChildNode = {...childNode, childNodes: [...childNode.childNodes]};
            } else {
                newChildNode = {...childNode};
            }
            currentNode.childNodes[childIndex] = newChildNode;
            currentNode = newChildNode;
        }
    }
    return newRootNode;
}

/**
 * Get file node path excluding the `rootNode`.
 * @param rootNode the root node
 * @param path normalized path
 */
export function getFileNodePath(rootNode: FileNode, path: string): FileNode[] | null {
    if (path === '') {
        return [];
    }
    const pathNames = path.split('/');
    const fileNodePath = _getValidSubFileNodePath(rootNode.childNodes, pathNames);
    return pathNames.length === fileNodePath.length ? fileNodePath : null;
}

/**
 * Get valid sub file node path excluding the `rootNode`.
 * @param rootNode the root node
 * @param path normalized path
 */
export function getValidSubFileNodePath(rootNode: FileNode, path: string): FileNode[] {
    return _getValidSubFileNodePath(rootNode.childNodes, path.split('/'));
}

function _getValidSubFileNodePath(rootNodes: FileNode[] | undefined, pathNames: string[]): FileNode[] {
    let childNodes = rootNodes;
    let fileNodePath: FileNode[] = [];
    for (let depth = 0; depth < pathNames.length; depth++) {
        if (!childNodes) {
            return fileNodePath;
        }
        const name = pathNames[depth];
        const node = childNodes.find(n => n.name.localeCompare(name) === 0);
        if (!node) {
            return fileNodePath;
        }
        fileNodePath.push(node);
        childNodes = node.childNodes;
    }
    return fileNodePath;
}

/**
 * Get the file node in `rootNode` for given `path`.
 * @param rootNode the root node
 * @param path normalized path
 */
export function getFileNode(rootNode: FileNode, path: string): FileNode | null {
    if (path === "") {
        return rootNode;
    }
    const fileNodePath = getFileNodePath(rootNode, path);
    if (fileNodePath) {
        if (fileNodePath.length === 0) {
            return rootNode;
        } else {
            return fileNodePath[fileNodePath.length - 1];
        }
    }
    return null;
}

/**
 * Get an icon name for given file node.
 * @param node the file node
 */
export function getFileNodeIcon(node: FileNode): IconName {
    return node.isDir ? "folder-close" : "document";
}

export function compareFileNames(a: FileNode, b: FileNode) {
    if (a.isDir) {
        if (!b.isDir) {
            return -1;
        }
    } else if (b.isDir) {
        return 1;
    }
    return a.name.localeCompare(b.name);
}

export function compareFileLastModified(a: FileNode, b: FileNode) {
    if (a.isDir) {
        if (!b.isDir) {
            return -1;
        }
    } else if (b.isDir) {
        return 1;
    }
    if (isString(a.lastModified)) {
        if (isString(b.lastModified)) {
            const compValue = a.lastModified.localeCompare(b.lastModified);
            if (compValue !== 0) {
                return compValue;
            }
        }
    } else if (isString(b.lastModified)) {
        return -1;
    }
    return a.name.localeCompare(b.name);
}

export function compareFileSize(a: FileNode, b: FileNode) {
    if (a.isDir) {
        if (!b.isDir) {
            return -1;
        }
    } else if (b.isDir) {
        return 1;
    }
    if (isNumber(a.size)) {
        if (isNumber(b.size)) {
            const compValue = a.size - b.size;
            if (compValue !== 0) {
                return compValue;
            }
        }
    } else if (isNumber(b.size)) {
        return -1;
    }
    return a.name.localeCompare(b.name);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Path operations

/**
 * Add `path` to the expanded paths `expandedPaths`. Return a new, updated array of expanded paths.
 * @param expandedPaths array of expanded paths
 * @param path normalized path
 * @returns a new array of expanded paths
 */
export function addExpandedDirPath(expandedPaths: string[], path: string): string[] {
    const parentDir = getParentDir(path);
    const cleanedPaths = expandedPaths.filter(p => !(p === path || p === parentDir || path.startsWith(p + '/')));
    return [...cleanedPaths, path];
}

/**
 * Remove `path` from the expanded paths `expandedPaths`. Return new, updated array of expanded paths.
 * @param expandedPaths array of expanded paths
 * @param path normalized path
 * @returns a new array of expanded paths
 */
export function removeExpandedDirPath(expandedPaths: string[], path: string): string[] {
    const parentDir = getParentDir(path);
    const cleanedPaths = expandedPaths.filter(p => !(p === path || p === parentDir || p.startsWith(path + '/')));
    return parentDir !== '' ? [...cleanedPaths, parentDir] : cleanedPaths;
}

export function getParentDir(path: string): string {
    if (path.startsWith('//')) {
        const index = path.substring(2).lastIndexOf('/');
        return (index > 0) ? path.substring(0, index + 2) : '';
    }
    const index = path.lastIndexOf('/');
    return (index > 0) ? path.substring(0, index) : '';
}

export function getBasename(path: string): string {
    const index = path.lastIndexOf('/');
    if (index >= 0) {
        return path.substring(index + 1);
    }
    return path;
}

export function getBasenameExtension(basename: string): string {
    const index = basename.lastIndexOf('.');
    if (index > 0) {
        return basename.substring(index + 1);
    }
    return '';
}

export function isPathValidAtIndex(path: string[], index: number, name: string): boolean {
    return index < path.length && path[index] === name;
}

export function applyFileFilter(nodes: FileNode[], fileFilter: FileFilter): FileNode[] {
    const extSet = new Set<string>(fileFilter.extensions);
    if (extSet.has('*')) {
        return nodes;
    }
    return nodes.filter(node => {
        if (node.isDir) {
            return true;
        }
        const ext = getBasenameExtension(node.name);
        return extSet.has(ext);
    });
}

/**
 * Parse a text value entered by the user into an array of normalized paths.
 * @param inputValue text value entered by the user, note this is an un-normalized path
 * @param currentDirPath the current directory
 * @param multiSelection if multiple selections are allowed
 * @param hostOS host OS name
 * @returns an array of normalized paths
 */
export function fromPathInputValue(inputValue: string,
                                   currentDirPath: string,
                                   multiSelection: boolean,
                                   hostOS?: HostOS): string[] {
    inputValue = inputValue.trim()
    if (inputValue === '') {
        return [];
    }
    let paths;
    if (!multiSelection) {
        paths = [inputValue];
    } else {
        const isWindows = hostOS === 'Windows';
        paths = [];
        let escChar = null;
        let token = '';
        for (let i = 0; i < inputValue.length; i++) {
            const char = inputValue[i];
            if (char === '"' || char === "'") {
                if (escChar === null) {
                    escChar = char;
                    token = '';
                } else if (escChar === char) {
                    escChar = null;
                } else {
                    token += char;
                }
            } else if (char === ' ') {
                if (escChar === null) {
                    if (token !== '') {
                        paths.push(token);
                        token = '';
                    }
                } else {
                    token += char;
                }
            } else if (!isWindows && char === '\\') {
                // escape char
            } else {
                token += char;
            }
        }
        if (token !== '') {
            paths.push(token);
        }
    }
    return paths.map(p => toAbsolutePath(p, currentDirPath, hostOS));
}

export function isAbsolutePath(path: string, hostOS?: HostOS) {
    if (hostOS === 'Windows') {
        return isWindowsRootPath(path);
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

function isWindowsNetworkDevicePath(path: string): boolean {
    return path.startsWith('//') || path.startsWith('\\\\');
}

function isWindowsDrivePath(path: string): boolean {
    return path.length >= 2
        && /^[a-z]+$/i.test(path[0])
        && path[1] === ':'
        && (path.length === 2 || path[2] === '/' || path[2] === '\\');
}

/**
 * Make `path1` relative to another (directory) path `path2`.
 * Both paths must be either relative or absolute, otherwise the
 * result is not defined.
 *
 * @param path1 first normalized path
 * @param path2 second normalized path
 * @returns `path1` relative to `path2`.
 */
export function makeRelativePath(path1: string, path2: string): string {
    if (path1 === '' || path1 === path2) {
        return "";
    }
    const comps1 = path1.split('/');
    const comps2 = path2.split('/');
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
        relPathComps = Array<string>(n2 - iFirstDiff).fill('..');
    } else {
        relPathComps = [];
    }
    if (n1 > iFirstDiff) {
        relPathComps = relPathComps.concat(comps1.slice(iFirstDiff));
    }
    return relPathComps.join('/');
}

/**
 * Convert path into normalized form used in the UI and server communication.
 * @param path a unnormalized path, e.g. from user input
 * @param hostOS host OS name
 */
function normalizePath(path: string, hostOS?: HostOS): string {
    let prefix;

    if (hostOS === 'Windows') {
        // Normalize back-slashes into forward slashes
        while (path.indexOf('\\') >= 0) {
            path = path.replace('\\', '/');
        }
        if (path.startsWith('//')) {
            // Note special case on Windows, where '//' are prefixes for network devices
            prefix = '//';
            path = path.substring(2);
        }
    } else {
        // Remove back-slashes, because they escape special characters on non-Windows hosts
        while (path.indexOf('\\') >= 0) {
            path = path.replace('\\', '');
        }
    }

    // Normalize by trimming leading '/'
    while (path.startsWith('/')) {
        path = path.substring(1);
    }
    // Normalize by trimming trailing '/'
    while (path.endsWith('/')) {
        path = path.substring(0, path.length - 1);
    }
    // Normalize by trimming double slashes '//'
    while (path.indexOf('//') > 0) {
        path = path.replace('//', '/')
    }

    return prefix ? prefix + path : path;
}


/**
 * Return an absolute path for given `path`. Note that the returned absolute path *never* start with
 * a slash ('/').
 * @param path an absolute or relative path
 * @param currentDirPath current path
 * @param hostOS host OS name
 */
export function toAbsolutePath(path: string, currentDirPath: string, hostOS?: HostOS): string {
    const abs = isAbsolutePath(path, hostOS);
    path = normalizePath(path, hostOS);
    if (abs) {
        return path;
    }
    if (currentDirPath === '') {
        return path;
    }
    return currentDirPath + '/' + path;
}

/**
 * Format an array of selected paths into a text value that the user can edit.
 * @param selectedPaths array of selected paths
 * @param multiSelection if multiple selections are allowed
 * @returns a text value that the user can edit
 */
export function toPathInputValue(selectedPaths: string[], multiSelection: boolean): string {
    if (selectedPaths.length === 0) {
        return '';
    }
    if (!multiSelection) {
        return getBasename(selectedPaths[0]);
    }
    return selectedPaths.map(p => escapePath(getBasename((p)))).join(' ');
}

function escapePath(path: string): string {
    if (path.indexOf(' ') >= 0) {
        if (path.indexOf('"') >= 0) {
            return `'${path}'`;
        } else {
            return `"${path}"`;
        }
    }
    return path;
}
