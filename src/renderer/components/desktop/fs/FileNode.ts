import { IconName } from '@blueprintjs/core';
import { getBasename, getBasenameExtension, getParentPath, HostOS, isAbsolutePath } from '../../../../common/paths';

import { isNumber, isString } from '../../../../common/types';
import { FileFilter } from '../types';


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
// FileDialog-internal path operations

/**
 * Add `path` to the expanded paths `expandedPaths`. Return a new, updated array of expanded paths.
 * @param expandedPaths array of expanded paths
 * @param path normalized path
 * @returns a new array of expanded paths
 */
export function addExpandedDirPath(expandedPaths: string[], path: string): string[] {
    const parentDir = getParentPath(path);
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
    const parentDir = getParentPath(path);
    const cleanedPaths = expandedPaths.filter(p => !(p === path || p === parentDir || p.startsWith(path + '/')));
    return parentDir !== '' ? [...cleanedPaths, parentDir] : cleanedPaths;
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
 * @param currentDirPath the current, normalized directory
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

/**
 * Convert path into internal normalized form used in the FileDialog UI.
 * @param path a non-normalized path, e.g. from user input
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
 * @param currentDirPath current, normalized path
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
