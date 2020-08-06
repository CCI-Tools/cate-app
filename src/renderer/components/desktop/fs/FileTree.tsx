import * as React from 'react';
import { ITreeNode, Spinner, Tree } from "@blueprintjs/core";

import { FileNode, getFileNodeIcon, getParentDir, isPathValidAtIndex } from './file-system';


type IFileTreeNode = ITreeNode<FileNode>;

export interface IFileTreeProps {
    rootNode: FileNode;

    selectedPath?: string | null;
    onSelectedPathChange?: (selectedPath: string | null) => void;

    expandedPaths?: string[];
    onExpandedPathsChange?: (expandedPaths: string[]) => void;

    showFiles?: boolean;
}

const FileTree: React.FC<IFileTreeProps> = (
    {
        rootNode,
        selectedPath,
        onSelectedPathChange,
        expandedPaths,
        onExpandedPathsChange,
        showFiles
    }
) => {
    if (!rootNode.childNodes) {
        return (
            // TODO (forman): center spinner
            <Spinner size={48}/>
        );
    }

    const treeNodes = getTreeNodes(rootNode,
                                   selectedPath,
                                   expandedPaths.length > 0 ? expandedPaths : null,
                                   showFiles);

    const handleNodeClick = (treeNode: IFileTreeNode, nodePath: number[]) => {
        if (treeNode.nodeData.isDirectory) {
            const path = getFileNodePath(rootNode, nodePath);
            if (onSelectedPathChange) {
                onSelectedPathChange(path !== selectedPath ? path : null);
            }
        }
    };

    const handleNodeCollapse = (treeNode: IFileTreeNode, nodePath: number[]) => {
        if (treeNode.nodeData.isDirectory) {
            const path = getFileNodePath(rootNode, nodePath);
            if (onExpandedPathsChange) {
                const cleanedPaths = expandedPaths.filter(p => p !== path && !p.startsWith(path + '/'));
                const parentDir = getParentDir(path);
                onExpandedPathsChange(parentDir !== '' ? [...cleanedPaths, parentDir] : cleanedPaths);
            }
        }
    };

    const handleNodeExpand = (treeNode: IFileTreeNode, nodePath: number[]) => {
        if (treeNode.nodeData.isDirectory) {
            const path = getFileNodePath(rootNode, nodePath);
            if (onExpandedPathsChange) {
                const cleanedPaths = expandedPaths.filter(p => p !== path && !path.startsWith(p + '/'));
                onExpandedPathsChange([...cleanedPaths, path]);
            }
        }
    };

    return (
        <Tree
            contents={treeNodes}
            onNodeClick={handleNodeClick}
            onNodeCollapse={handleNodeCollapse}
            onNodeExpand={handleNodeExpand}
        />
    );
}

export default FileTree;


function getTreeNodes(rootNode: FileNode,
                      selectedPath: string | null,
                      expandedPaths: string[] | null,
                      includeFiles: boolean): IFileTreeNode[] {
    if (!rootNode.childNodes) {
        return [];
    }
    const idGen: [number] = [0];
    return _getTreeNodes(rootNode.childNodes,
                         selectedPath ? selectedPath.split('/') : [],
                         expandedPaths ? expandedPaths.map(p => p.split('/')) : [],
                         includeFiles,
                         0,
                         idGen);
}

function _getTreeNodes(fileNodes: FileNode[],
                       selectedPath: string[] | null,
                       expandedPaths: string[][] | null,
                       includeFiles: boolean,
                       depth: number,
                       idGen: [number]): IFileTreeNode[] {
    if (!includeFiles) {
        fileNodes = fileNodes.filter(node => node.isDirectory);
    }
    return fileNodes.map(node => {

        let _selectedPath = selectedPath;
        let isSelected = false;
        if (_selectedPath && isPathValidAtIndex(_selectedPath, depth, node.name)) {
            isSelected = depth === _selectedPath.length - 1;
        } else {
            _selectedPath = null;
        }

        let _expandedPaths = expandedPaths;
        let isExpanded = false;
        if (_expandedPaths) {
            _expandedPaths = _expandedPaths.filter(p => isPathValidAtIndex(p, depth, node.name));
            _expandedPaths = _expandedPaths.length > 0 ? _expandedPaths : null;
            isExpanded = _expandedPaths !== null;
        } else {
            _expandedPaths = null;
        }

        const id = idGen[0];
        idGen[0] = id + 1;
        let childNodes;
        if (node.childNodes) {
            childNodes = _getTreeNodes(node.childNodes,
                                       _selectedPath,
                                       _expandedPaths,
                                       includeFiles,
                                       depth + 1,
                                       idGen);
        }
        let hasCaret;
        if (includeFiles) {
            hasCaret = node.isDirectory && Boolean(childNodes && childNodes.find(n => n.isDirectory));
        } else {
            hasCaret = node.isDirectory && Boolean(childNodes && childNodes.length);
        }
        return {
            id,
            label: node.name,
            icon: getFileNodeIcon(node),
            hasCaret,
            isSelected,
            isExpanded,
            childNodes,
            nodeData: node,
        };
    });
}

function getFileNodePath(rootNode: FileNode,
                         nodePath: number[]): string | null {
    let fileNodePath = null;
    let childNodes = rootNode.childNodes;
    if (!childNodes) {
        return null;
    }
    for (let depth = 0; depth < nodePath.length; depth++) {
        let childIndex = nodePath[depth];
        let childNode = childNodes[childIndex];

        if (fileNodePath === null) {
            fileNodePath = childNode.name;
        } else {
            fileNodePath += '/' + childNode.name;
        }

        childNodes = childNode.childNodes;
        if (childNodes) {
            childNodes = childNode.childNodes;
        } else if (depth < nodePath.length - 1) {
            return null;
        }
    }
    return fileNodePath;
}




