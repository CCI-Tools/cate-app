import { IconName } from '@blueprintjs/core';
import { FileFilter } from '../types';


export interface FileNode {
    name: string;
    lastModified: string;
    size: number;
    status?: 'fetching' | 'ready' | 'error';
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
    return _updateFileNode(rootNode, sanitizePath(path).split('/'), updatedFileNode);
}

function _updateFileNode(rootNode: FileNode, path: string[], updatedFileNode: FileNode): FileNode | null {
    if (!rootNode.childNodes) {
        // can't work without child nodes
        return null;
    }
    updatedFileNode = !updatedFileNode.status ? {...updatedFileNode, status: 'ready'} : updatedFileNode;
    const newRootNode: FileNode = {...rootNode, childNodes: [...rootNode.childNodes]};
    let currentNode:FileNode = newRootNode;
    for (let depth = 0; depth < path.length; depth++) {
        if (!currentNode.childNodes) {
            // can't work without child nodes
            return null;
        }
        const name = path[depth];
        const childIndex = currentNode.childNodes.findIndex(n => n.name.localeCompare(name) === 0);
        if (childIndex < 0) {
            // node does not exist
            return null;
        }
        if (depth === path.length - 1) {
            currentNode.childNodes[childIndex] = updatedFileNode;
        } else {
            currentNode.childNodes[childIndex] = {...currentNode, childNodes: [...currentNode.childNodes]};
            currentNode = currentNode.childNodes[childIndex];
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
    return _getFileNodePath(rootNode.childNodes, sanitizePath(path).split('/'));
}

function _getFileNodePath(rootNodes: FileNode[], path: string[]): FileNode[] | null {
    let childNodes = rootNodes;
    let fileNodePath: FileNode[] = [];
    for (let depth = 0; depth < path.length; depth++) {
        if (!childNodes) {
            // can't work without child nodes
            return null;
        }
        const name = path[depth];
        const node = childNodes.find(n => n.name.localeCompare(name) === 0);
        if (!node) {
            // node does not exist
            return null;
        }
        fileNodePath.push(node);
        childNodes = node.childNodes;
    }
    return fileNodePath;
}

export function getFileNode(rootNode: FileNode, dirPath: string): FileNode | null {
    if (!rootNode.childNodes) {
        return null;
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

export function cloneFileNodes(rootNodes: FileNode[]): FileNode[] {
    return rootNodes.map(cloneFileNode);
}

export function cloneFileNode(node: FileNode): FileNode {
    let childNodes = node.childNodes;
    if (node.childNodes) {
        childNodes = cloneFileNodes(childNodes);
    }
    return {...node, childNodes};
}

/*
export function filterFileNodes<T>(nodes: FileNode[],
                                   predicate: (node: FileNode, index: number) => boolean,
                                   recursive: boolean = false): FileNode[] {
    let filteredNodes = [...nodes.filter(predicate)];
    for (let i = 0; i < filteredNodes.length; i++) {
        const filteredNode = filteredNodes[i];
        if (filteredNode.childNodes) {
            const filteredChildNodes = filterFileNodes<T>(filteredNode.childNodes, predicate);
            if (filteredChildNodes !== filteredNode.childNodes) {
                filteredNodes[i] = {...filteredNode, childNodes: filteredChildNodes};
            }
        }
    }
    return filteredNodes;
}
*/


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

