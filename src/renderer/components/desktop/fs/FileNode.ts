import { IconName } from '@blueprintjs/core';
import { FileFilter } from '../types';


export type FileNodeStatus = 'updating' | 'ready' | 'error';

export interface FileNode {
    name: string;
    lastModified: string;
    size: number;
    status?: FileNodeStatus;
    isDirectory: boolean;
    childNodes?: FileNode[];
}

export const ALL_FILES_FILTER = {name: "All files", extensions: ["*"]};

/**
 * Returns a new `rootNode` where `updatedFileNode` is inserted at position given by `path`.
 * @param rootNode
 * @param path
 * @param updatedFileNode
 */
export function updateFileNode(rootNode: FileNode, path: string, updatedFileNode: FileNode): FileNode {
    path = sanitizePath(path);
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
 * @param rootNode
 * @param path
 */
export function getFileNodePath(rootNode: FileNode, path: string): FileNode[] | null {
    path = sanitizePath(path);
    if (path === '') {
        return [];
    }
    const pathNames = path.split('/');
    const fileNodePath = _getValidSubFileNodePath(rootNode.childNodes, pathNames);
    return pathNames.length === fileNodePath.length ? fileNodePath : null;
}

/**
 * Get valid sub file node path excluding the `rootNode`.
 * @param rootNode
 * @param path
 */
export function getValidSubFileNodePath(rootNode: FileNode, path: string): FileNode[] {
    path = sanitizePath(path);
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


export function getFileNode(rootNode: FileNode, dirPath: string): FileNode | null {
    if (dirPath === "") {
        return rootNode;
    }
    const fileNodePath = getFileNodePath(rootNode, dirPath);
    if (fileNodePath) {
        if (fileNodePath.length === 0) {
            return rootNode;
        } else {
            return fileNodePath[fileNodePath.length - 1];
        }
    }
    return null;
}

export function addExpandedDirPath(expandedPaths: string[], path: string): string[] {
    const parentDir = getParentDir(path);
    const cleanedPaths = expandedPaths.filter(p => !(p === path || p === parentDir || path.startsWith(p + '/')));
    return [...cleanedPaths, path];
}

export function removeExpandedDirPath(expandedPaths: string[], path: string): string[] {
    const parentDir = getParentDir(path);
    const cleanedPaths = expandedPaths.filter(p => !(p === path || p === parentDir || p.startsWith(path + '/')));
    return parentDir !== '' ? [...cleanedPaths, parentDir] : cleanedPaths;
}

export function getFileNodeIcon(node: FileNode): IconName {
    return node.isDirectory ? "folder-close" : "document";
}

export function getParentDir(path: string): string {
    const index = path.lastIndexOf('/');
    if (index > 0) {
        return path.substring(0, index);
    }
    return "";
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
        if (node.isDirectory) {
            return true;
        }
        const ext = getBasenameExtension(node.name);
        return extSet.has(ext);
    });
}

export function sanitizePath(path: string): string {
    while (path.indexOf('\\') >= 0) {
        path = path.replace('\\', '/')
    }
    while (path.indexOf('//') >= 0) {
        path = path.replace('//', '/')
    }
    while (path.startsWith('/')) {
        path = path.substring(1);
    }
    while (path.endsWith('/')) {
        path = path.substring(0, path.length - 1);
    }
    return path;
}

export function compareFileNames(a: FileNode, b: FileNode) {
    if (a.isDirectory) {
        if (!b.isDirectory) {
            return -1;
        }
    } else if (b.isDirectory) {
        return 1;
    }
    return a.name.localeCompare(b.name);
}

export function compareFileLastModified(a: FileNode, b: FileNode) {
    if (a.isDirectory) {
        if (!b.isDirectory) {
            return -1;
        }
    } else if (b.isDirectory) {
        return 1;
    }
    if (a.lastModified === b.lastModified) {
        return a.name.localeCompare(b.name);
    }
    return a.lastModified.localeCompare(b.lastModified);
}

export function compareFileSize(a: FileNode, b: FileNode) {
    if (a.isDirectory) {
        if (!b.isDirectory) {
            return -1;
        }
    } else if (b.isDirectory) {
        return 1;
    }
    if (a.size === b.size) {
        return a.name.localeCompare(b.name);
    }
    return a.size - b.size;
}

