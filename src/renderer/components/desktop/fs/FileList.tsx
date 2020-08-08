import * as React from "react";
import { Colors, HTMLTable, Icon, Spinner } from '@blueprintjs/core';

import { FileFilter } from '../types';
import { applyFileFilter, compareFileNames, FileNode, getFileNodeIcon, getFileNodePath } from './FileNode';
import RootNodeLoading from './RootNodeLoading';


const ROW_DEFAULT_STYLE: React.CSSProperties = {};
const ROW_SELECTED_STYLE: React.CSSProperties = {...ROW_DEFAULT_STYLE, backgroundColor: Colors.BLUE3};
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
    selectedDirPath?: string | null;

    fileFilter?: FileFilter;
    multiSelections?: boolean;
    openDirectory?: boolean;

    selectedPaths?: string[];
    onSelectedPathsChange?: (selectedPaths: string[]) => any;

    onSelectedDirPathChange?: (selectedDirPath: string | null) => any;
}

const FileList: React.FC<IFileListProps> = (
    {
        rootNode,
        fileFilter,
        multiSelections,
        openDirectory,
        selectedDirPath,
        /**
         * Convention: the selectedPath's parent determines the nodes in fileNodes to be listed.
         * If the selectedPath's basename exists, it will be used to highlight the related node.
         * If not, and this is the case if selectedPath ends with a "/" nothing will be selected.
         */
        selectedPaths,
        onSelectedPathsChange,
        onSelectedDirPathChange
    }
) => {
    // const [sortedIndexMap, setSortedIndexMap] = React.useState<number[]>([]);

    let currentFileNodes = rootNode.childNodes;
    if (selectedDirPath) {
        const selectedFileNodes = getFileNodePath(rootNode, selectedDirPath);
        if (selectedFileNodes) {
            if (selectedFileNodes.length > 0) {
                currentFileNodes = selectedFileNodes[selectedFileNodes.length - 1].childNodes;
            }
        }
    }

    if (currentFileNodes) {
        if (fileFilter) {
            currentFileNodes = applyFileFilter(currentFileNodes, fileFilter);
        }
        currentFileNodes = currentFileNodes.sort(compareFileNames);
    }

    const selectedPathSet = new Set(selectedPaths);

    const getRowFileNode = (rowIndex: number): FileNode => {
        // TODO (forman): implement sorting
        /*
        const sortedRowIndex = sortedIndexMap[rowIndex];
        if (typeof sortedRowIndex === 'number') {
            rowIndex = sortedRowIndex;
        }
        */
        return currentFileNodes[rowIndex];
    };

    const getRowPath = (rowIndex: number): string => {
        let node = getRowFileNode(rowIndex);
        let path = node.name;
        if (selectedDirPath) {
            path = selectedDirPath + '/' + node.name;
        }
        return path;
    };

    const isRowSelected = (rowIndex: number): boolean => {
        return selectedPathSet.has(getRowPath(rowIndex));
    };

    const renderFileNodeName = (rowIndex: number) => {
        const node = getRowFileNode(rowIndex);
        return <span><Icon icon={getFileNodeIcon(node)}/>&nbsp;{node.name}</span>;
    };

    const renderFileNodeLastModified = (rowIndex: number) => {
        const node = getRowFileNode(rowIndex);
        return <span>{node.lastModified}</span>;
    };

    const renderFileNodeSize = (rowIndex: number) => {
        const node = getRowFileNode(rowIndex);
        return <span>{node.size}</span>;
    };

    const handleRowClick = (fileNode: FileNode, rowIndex: number, event: React.MouseEvent<HTMLTableRowElement>) => {
        if (!openDirectory) {
            const node = getRowFileNode(rowIndex);
            if (node.isDirectory) {
                return;
            }
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
        if (onSelectedDirPathChange) {
            const node = getRowFileNode(rowIndex);
            if (node.isDirectory) {
                onSelectedDirPathChange(getRowPath(rowIndex));
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
