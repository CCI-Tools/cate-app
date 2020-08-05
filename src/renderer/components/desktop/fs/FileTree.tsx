import * as React from 'react';
import { ITreeNode, Tree } from "@blueprintjs/core";

import { FileNode, getFileNodeIcon, isPathValidAtIndex } from './file-system';


type IFileTreeNode = ITreeNode<FileNode>;

export interface IFileTreeProps {
    fileNodes: FileNode[];

    selectedPath?: string | null;
    onSelectedPathChange?: (selectedPath: string | null) => void;

    expandedPaths?: string[] | null;
    onExpandedPathsChange?: (expandedPaths: string[] | null) => void;

    showFiles?: boolean;
}

const FileTree: React.FC<IFileTreeProps> = (
    {
        fileNodes,
        selectedPath,
        onSelectedPathChange,
        expandedPaths,
        onExpandedPathsChange,
        showFiles
    }
) => {
    const treeNodes = getTreeNodes(fileNodes,
                                   selectedPath || null,
                                   expandedPaths || null,
                                   showFiles);

    const handleNodeClick = (treeNode: IFileTreeNode, nodePath: number[]) => {
        if (treeNode.nodeData.isDirectory) {
            const path = getFileNodePath(fileNodes, nodePath);
            if (onSelectedPathChange) {
                onSelectedPathChange(path !== selectedPath ? path : null);
            }
        }
    };

    const handleNodeCollapse = (treeNode: IFileTreeNode, nodePath: number[]) => {
        if (treeNode.nodeData.isDirectory) {
            const path = getFileNodePath(fileNodes, nodePath);
            if (onExpandedPathsChange) {
                const paths = (expandedPaths || []).filter(p => p !== path);
                onExpandedPathsChange(paths.length > 0 ? paths : null);
            }
        }
    };

    const handleNodeExpand = (treeNode: IFileTreeNode, nodePath: number[]) => {
        if (treeNode.nodeData.isDirectory) {
            const path = getFileNodePath(fileNodes, nodePath);
            if (onExpandedPathsChange) {
                onExpandedPathsChange([...expandedPaths, path]);
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


function getTreeNodes(fileNodes: FileNode[],
                      selectedPath: string | null,
                      expandedPaths: string[] | null,
                      includeFiles: boolean): IFileTreeNode[] {
    const idGen: [number] = [0];
    return _getTreeNodes(fileNodes,
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
    console.log('selectedPath', selectedPath);
    return fileNodes.map(node => {


        let _selectedPath = selectedPath;
        let isSelected = false;
        if (_selectedPath && isPathValidAtIndex(_selectedPath, depth, node.name)) {
            isSelected = depth === _selectedPath.length - 1;
        } else {
            _selectedPath = null;
        }

        //console.log('_selectedPath, depth, node.name, isSelected', _selectedPath, depth, node.name, isSelected);

        let _expandedPaths = expandedPaths;
        let isExpanded = false;
        if (_expandedPaths) {
            _expandedPaths = _expandedPaths.filter(p => isPathValidAtIndex(p, depth, node.name));
            _expandedPaths = _expandedPaths.length > 0 ? _expandedPaths : null;
            isExpanded = _expandedPaths !== null;
        } else {
            _expandedPaths = null;
        }

        console.log('_expandedPaths, depth, node.name, isExpanded', _expandedPaths, depth, node.name, isExpanded);

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
        return {
            id,
            label: node.name,
            icon: getFileNodeIcon(node),
            hasCaret: node.isDirectory && Boolean(childNodes && childNodes.length),
            isSelected,
            isExpanded,
            childNodes,
            nodeData: node,
        };
    });
}

function getFileNodePath(fileNodes: FileNode[],
                         nodePath: number[]): string | null {
    let fileNodePath = null;
    let childNodes = fileNodes;
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




