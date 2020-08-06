import { IconName } from '@blueprintjs/core';
import { FileFilter } from '../types';

export interface FileNode {
    name: string;
    lastModified: string;
    size: number;
    status?: 'fetching' | 'ready';
    isDirectory: boolean;
    childNodes?: FileNode[];
}

export const ALL_FILES_FILTER = {name: "All files", extensions: ["*"]};

export function isPathValidAtIndex(path: string[], index: number, name: string): boolean {
    return index < path.length && path[index] === name;
}

export function getFileNodePath(nodes: FileNode[], path: string): FileNode[] | null {
    return _getFileNodePath(nodes, path.split('/'));
}

export function _getFileNodePath(nodes: FileNode[], path: string[]): FileNode[] | null {
    let childNodes = nodes;
    let result: FileNode[] | null = null;
    for (let depth = 0; depth < path.length; depth++) {
        const name = path[depth];
        if (name === '' && depth === path.length - 1) {
            // If the last path component is "", this means path ended with a "/".
            return result;
        }
        const node = childNodes.find(n => n.name.localeCompare(name) === 0);
        if (!node) {
            return null;
        }
        if (result === null) {
            result = [node];
        } else {
            result.push(node);
        }
        if (depth === path.length - 1) {
            return result;
        }
        childNodes = node.childNodes;
        if (!childNodes || childNodes.length === 0) {
            return result;
        }
    }
    return null;
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

export function getFilenameExtension(name: string): string {
    const index = name.lastIndexOf('.');
    if (index > 0) {
        return name.substr(index + 1);
    }
    return '';
}

export function getParentDir(path: string): string {
    const components = path.split('/');
    if (components.length === 1) {
        return '';
    }
    return components.slice(0, components.length - 1).join('/');
}

export function applyFileFilter(nodes: FileNode[], fileFilter: FileFilter) {
    const extSet = new Set<string>(fileFilter.extensions);
    if (extSet.has('*')) {
        return nodes;
    }
    return nodes.filter(node => {
        if (node.isDirectory) {
            return true;
        }
        const ext = getFilenameExtension(node.name);
        return extSet.has(ext);
    });
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

