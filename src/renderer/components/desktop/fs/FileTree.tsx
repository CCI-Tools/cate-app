import * as React from 'react';
import { Colors, Icon, ITreeNode, Spinner, Tree } from "@blueprintjs/core";

import {
    addExpandedDirPath,
    FileNode,
    getFileNodeIcon,
    isPathValidAtIndex,
    removeExpandedDirPath
} from './FileNode';
import RootNodeLoading from './RootNodeLoading';

const TREE_CONTAINER_STYLE: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'auto',
    borderColor: Colors.DARK_GRAY2,
    borderStyle: 'solid',
    borderWidth: 1
};

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
        return <RootNodeLoading rootNode={rootNode}/>;
    }

    const treeNodes = getTreeNodes(rootNode,
                                   selectedPath || null,
                                   expandedPaths && expandedPaths.length > 0 ? expandedPaths : null,
                                   Boolean(showFiles));

    const handleNodeClick = (treeNode: IFileTreeNode, nodePath: number[]) => {
        if (onSelectedPathChange) {
            if (treeNode.nodeData!.isDirectory) {
                const path = getFileNodePath(treeNodes, nodePath);
                onSelectedPathChange(path !== selectedPath ? path : null);
            }
        }
    };

    const handleNodeExpand = (treeNode: IFileTreeNode, nodePath: number[]) => {
        if (onExpandedPathsChange) {
            if (treeNode.nodeData!.isDirectory) {
                const path = getFileNodePath(treeNodes, nodePath);
                onExpandedPathsChange(addExpandedDirPath(expandedPaths || [], path));
            }
        }
    };

    const handleNodeCollapse = (treeNode: IFileTreeNode, nodePath: number[]) => {
        if (onExpandedPathsChange) {
            if (treeNode.nodeData!.isDirectory) {
                const path = getFileNodePath(treeNodes, nodePath);
                onExpandedPathsChange(removeExpandedDirPath(expandedPaths || [], path));
            }
        }
    };

    return (
        <div style={TREE_CONTAINER_STYLE}>
            <Tree
                contents={treeNodes}
                onNodeClick={handleNodeClick}
                onNodeExpand={handleNodeExpand}
                onNodeCollapse={handleNodeCollapse}
            />
        </div>
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
        let hasCaret: boolean;
        if (includeFiles) {
            hasCaret = node.isDirectory && (!childNodes || Boolean(childNodes.find(n => n.nodeData!.isDirectory)));
        } else {
            hasCaret = node.isDirectory && (!childNodes || childNodes.length > 0);
        }
        let secondaryLabel;
        if (node.status === 'updating') {
            secondaryLabel = <Spinner size={16}/>;
        } else if (node.status === 'error') {
            secondaryLabel = <Icon icon='error' iconSize={16}/>;
        }
        return {
            id,
            icon: getFileNodeIcon(node),
            label: node.name,
            secondaryLabel,
            hasCaret,
            isSelected,
            isExpanded,
            childNodes,
            nodeData: node,
        };
    });
}

function getFileNodePath(rootNodes: IFileTreeNode[],
                         nodePath: number[]): string {
    let fileNodePath = null;
    let childNodes = rootNodes;
    for (let depth = 0; depth < nodePath.length; depth++) {
        if (!childNodes) {
            // Weird!
            throw new Error(`internal error: missing childNodes at index ${depth} in node path ${nodePath.join()}`);
        }
        let childIndex = nodePath[depth];
        let childNode = childNodes[childIndex];

        if (fileNodePath === null) {
            fileNodePath = childNode.nodeData!.name;
        } else {
            fileNodePath += '/' + childNode.nodeData!.name;
        }

        childNodes = childNode.childNodes;
    }
    return fileNodePath;
}
