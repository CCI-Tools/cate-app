import * as React from "react";
import { Colors, HTMLTable, Icon } from '@blueprintjs/core';

import { FileFilter } from '../types';
import { applyFileFilter, compareFileNames, FileNode, getFileNodeIcon, getFileNodePath } from './FileNode';

const NAME_CELL_STYLE: React.CSSProperties = {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
};
const NAME_ICON_STYLE = {
    marginRight: 5,
};
const SIZE_CELL_STYLE: React.CSSProperties = {
    width: '100%', textAlign: 'right'
};
const ROW_DEFAULT_STYLE: React.CSSProperties = {};
const ROW_SELECTED_STYLE: React.CSSProperties = {
    ...ROW_DEFAULT_STYLE, backgroundColor: Colors.BLUE3
};
const TABLE_CONTAINER_STYLE: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'auto',
    borderColor: Colors.DARK_GRAY2,
    borderStyle: 'solid',
    borderWidth: 1
};
const TABLE_STYLE: React.CSSProperties = {width: '100%'};

interface IFileListProps {
    rootNode: FileNode;

    fileFilter?: FileFilter | null;
    multiSelections?: boolean;
    openDirectory?: boolean;

    currentDirPath?: string | null;
    onCurrentDirPathChange?: (selectedDirPath: string) => any;
    selectedPaths?: string[];
    onSelectedPathsChange?: (selectedPaths: string[]) => any;
}

const FileList: React.FC<IFileListProps> = (
    {
        rootNode,
        fileFilter,
        multiSelections,
        openDirectory,
        currentDirPath,
        onCurrentDirPathChange,
        selectedPaths,
        onSelectedPathsChange,
    }
) => {
    // const [sortedIndexMap, setSortedIndexMap] = React.useState<number[]>([]);
    const currentFileNodes = getCurrentFileNodes(rootNode, currentDirPath, fileFilter);
    const selectedPathSet = new Set(selectedPaths);

    const getRowFileNode = (rowIndex: number): FileNode => {
        // TODO (forman): implement sorting
        /*
        const sortedRowIndex = sortedIndexMap[rowIndex];
        if (typeof sortedRowIndex === 'number') {
            rowIndex = sortedRowIndex;
        }
        */
        return currentFileNodes![rowIndex];
    };

    const getRowPath = (rowIndex: number): string => {
        let node = getRowFileNode(rowIndex);
        let path = node.name;
        if (currentDirPath) {
            path = currentDirPath + '/' + node.name;
        }
        return path;
    };

    const isRowSelected = (rowIndex: number): boolean => {
        return selectedPathSet.has(getRowPath(rowIndex));
    };

    const renderFileNodeName = (rowIndex: number) => {
        const node = getRowFileNode(rowIndex);
        return <div style={NAME_CELL_STYLE}><Icon style={NAME_ICON_STYLE} icon={getFileNodeIcon(node)}/><span>{node.name}</span></div>;
    };

    const renderFileNodeLastModified = (rowIndex: number) => {
        const node = getRowFileNode(rowIndex);
        return node.lastModified;
    };

    const renderFileNodeSize = (rowIndex: number) => {
        const node = getRowFileNode(rowIndex);
        return <div style={SIZE_CELL_STYLE}>{node.size}</div>;
    };

    const handleRowClick = (fileNode: FileNode, rowIndex: number, event: React.MouseEvent<HTMLTableRowElement>) => {
        // Disallow directory selection
        const node = getRowFileNode(rowIndex);
        if ((!openDirectory && node.isDirectory) || (openDirectory && !node.isDirectory)) {
            return;
        }
        const path = getRowPath(rowIndex);
        const newSelectedPathSet = new Set<string>(selectedPathSet);
        if (newSelectedPathSet.has(path)) {
            newSelectedPathSet.delete(path);
        } else {
            if (multiSelections && event.ctrlKey) {
                newSelectedPathSet.add(path);
            } else {
                newSelectedPathSet.clear();
                newSelectedPathSet.add(path);
            }
        }
        if (onSelectedPathsChange) {
            onSelectedPathsChange(Array.from(newSelectedPathSet));
        }
    };

    const handleRowDoubleClick = (fileNode: FileNode, rowIndex: number) => {
        if (onCurrentDirPathChange) {
            const node = getRowFileNode(rowIndex);
            if (node.isDirectory) {
                onCurrentDirPathChange(getRowPath(rowIndex));
            }
        }
    };

    return (
        <div style={TABLE_CONTAINER_STYLE}>
            <HTMLTable className="bp3-html-table-condensed bp3-interactive" style={TABLE_STYLE}>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th>Size</th>
                </tr>
                </thead>
                <tbody>
                {
                    currentFileNodes && currentFileNodes.map((node, rowIndex) => {
                        return (
                            <tr
                                key={rowIndex}
                                style={isRowSelected(rowIndex) ? ROW_SELECTED_STYLE : ROW_DEFAULT_STYLE}
                                onClick={(e) => handleRowClick(node, rowIndex, e)}
                                onDoubleClick={() => handleRowDoubleClick(node, rowIndex)}
                            >
                                <td>{renderFileNodeName(rowIndex)}</td>
                                <td>{renderFileNodeLastModified(rowIndex)}</td>
                                <td>{renderFileNodeSize(rowIndex)}</td>
                            </tr>
                        );
                    })
                }
                </tbody>
            </HTMLTable>
        </div>
    );
}

export default FileList;


function getCurrentFileNodes(rootNode: FileNode,
                             currentDirPath?: string | null,
                             fileFilter?: FileFilter | null): FileNode[] | undefined {
    let currentFileNodes = rootNode.childNodes;
    if (currentDirPath) {
        const currentFileNodesPath = getFileNodePath(rootNode, currentDirPath);
        if (currentFileNodesPath) {
            if (currentFileNodesPath.length > 0) {
                currentFileNodes = currentFileNodesPath[currentFileNodesPath.length - 1].childNodes;
            }
        }
    }

    if (currentFileNodes) {
        if (fileFilter) {
            currentFileNodes = applyFileFilter(currentFileNodes, fileFilter);
        }
        currentFileNodes = currentFileNodes.sort(compareFileNames);
    }

    return currentFileNodes;
}
