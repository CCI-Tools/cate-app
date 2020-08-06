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

export interface FileSystem {
    /**
     * Get the node representing the file system.
     * Any updates and changes in children of the root node will be reflected
     * in a new instance of the root node.
     */
    getRootNode: () => FileNode;

    /**
     * Schedule an update of node given by `path`.
     * If the node is a directory, children are listed too.
     * If `path` is not provided, root entries should be updated.
     *
     * Immediately sets the status of specified node to "updating".
     * After completion the status will be "ready".
     * Any status changes will be reflected in a new instance of `rootNode`.
     */
    updateNode: (path?: string) => any;

    /**
     * Create empty directory given by `dirPath`.
     * @param dirPath Absolute directory path
     */
    createDir: (dirPath: string) => any;

    /**
     * Delete given file or directories given by `paths`.
     * Directories must be empty to be deletable.
     * @param paths Absolute file or directory paths
     */
    deleteNodes: (paths: string[]) => any;
}

export const ALL_FILES_FILTER = {name: "All files", extensions: ["*"]};

export function isPathValidAtIndex(path: string[], index: number, name: string): boolean {
    return index < path.length && path[index] === name;
}

export function getFileNodePath(rootNode: FileNode, path: string): FileNode[] | null {
    return _getFileNodePath(rootNode.childNodes, path.split('/'));
}

export function _getFileNodePath(rootNodes: FileNode[], path: string[]): FileNode[] | null {
    let childNodes = rootNodes;
    if (!childNodes) {
        return null;
    }
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

export function getFileNode(rootNode: FileNode, dirPath: string): FileNode | null {
    if (!rootNode.childNodes) {
        return null;
    }
    const fileNodePath = getFileNodePath(rootNode, dirPath);
    if (fileNodePath && fileNodePath.length > 0) {
        return fileNodePath[fileNodePath.length - 1];
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

export function applyFileFilter(nodes: FileNode[], fileFilter: FileFilter) {
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

