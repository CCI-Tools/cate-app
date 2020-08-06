import { IconName } from '@blueprintjs/core';
import { SelectionModes, Table, Utils } from "@blueprintjs/table";
import { IRegion } from '@blueprintjs/table/src/regions';
import * as React from "react";
import { FileFilter } from '../types';

import SortableColumn from './SortableColumn';
import { applyFileFilter, FileNode, getFileNodeIcon, getFileNodePath } from './file-system';


interface IFileListProps {
    fileNodes: FileNode[];
    selectedDirPath?: string | null;

    fileFilter?: FileFilter;
    multipleSelection?: boolean;

    selectedPaths?: string[] | null;
    onSelectedPathsChange?: (selectedPaths: string[] | null) => void;
}

const FileList: React.FC<IFileListProps> = (
    {
        fileNodes,
        fileFilter,
        multipleSelection,
        selectedDirPath,
        /**
         * Convention: the selectedPath's parent determines the nodes in fileNodes to be listed.
         * If the selectedPath's basename exists, it will be used to highlight the related node.
         * If not, and this is the case if selectedPath ends with a "/" nothing will be selected.
         */
        selectedPaths,
        onSelectedPathsChange,
    }
) => {
    const [sortedIndexMap, setSortedIndexMap] = React.useState<number[]>([]);

    let currentFileNodes = fileNodes;
    if (selectedDirPath) {
        const selectedFileNodes = getFileNodePath(fileNodes, selectedDirPath);
        if (selectedFileNodes) {
            if (selectedFileNodes.length > 0) {
                currentFileNodes = selectedFileNodes[selectedFileNodes.length - 1].childNodes;
            }
        }
    }

    if (currentFileNodes && fileFilter) {
        currentFileNodes = applyFileFilter(currentFileNodes, fileFilter);
    }

    const selectedPathSet = new Set(selectedPaths);

    const getNodeForRow = (rowIndex: number): FileNode => {
        const sortedRowIndex = sortedIndexMap[rowIndex];
        if (typeof sortedRowIndex === 'number') {
            rowIndex = sortedRowIndex;
        }
        return currentFileNodes[rowIndex];
    };

    const getCellData = (rowIndex: number, columnIndex: number) => {
        const fileNode = getNodeForRow(rowIndex);
        if (columnIndex === 0) {
            return fileNode.name;
        }
        if (columnIndex === 1) {
            return fileNode.lastModified;
        }
        if (columnIndex === 2) {
            return fileNode.size;
        }
    };

    const getRowIcon = (rowIndex: number): IconName | null => {
        return getFileNodeIcon(getNodeForRow(rowIndex));
    };

    const getRowPath = (rowIndex: number): string => {
        let node = getNodeForRow(rowIndex);
        let path = node.name;
        if (selectedDirPath) {
            path = selectedDirPath + '/' + node.name;
        }
        return path;
    };

    const isRowSelected = (rowIndex: number): boolean => {
        return selectedPathSet.has(getRowPath(rowIndex));
    };

    const sortColumn = (columnIndex: number, comparator: (a: FileNode, b: FileNode) => number) => {
        const newSortedIndexMap = [...Utils.times(currentFileNodes.length, (i: number) => i)];
        newSortedIndexMap.sort((a: number, b: number) => {
            return comparator(currentFileNodes[a], currentFileNodes[b]);
        });
        setSortedIndexMap(newSortedIndexMap);
    };

    const handleSelection = (selectedRegions: IRegion[]): void => {
        console.log(selectedRegions);
        const newSelectedPathSet = new Set<string>();
        for (let selectedRegion of selectedRegions) {
            const rows = selectedRegion.rows;
            for (let rowIndex = rows[0]; rowIndex <= rows[1]; rowIndex++) {
                const path = getRowPath(rowIndex);
                if (!selectedPathSet.has(path)) {
                    newSelectedPathSet.add(path);
                }
            }
        }
        if (onSelectedPathsChange) {
            onSelectedPathsChange(newSelectedPathSet.size > 0 ? Array.from(newSelectedPathSet) : null);
        }
    };

    return (
        <Table
            numRows={currentFileNodes ? currentFileNodes.length : 0}
            selectionModes={SelectionModes.ROWS_AND_CELLS}
            enableRowHeader={false}
            enableColumnReordering={false}
            enableColumnResizing={true}
            enableMultipleSelection={multipleSelection}
            onSelection={handleSelection}
            selectedRegions={[]}
        >
            {
                [
                    SortableColumn({
                                       name: "Name",
                                       index: 0,
                                       getCellData,
                                       sortColumn,
                                       getRowIcon,
                                       isRowSelected,
                                       comparator: nameComparator,
                                   }),
                    SortableColumn({
                                       name: "Last Modified",
                                       index: 1,
                                       getCellData,
                                       sortColumn,
                                       isRowSelected,
                                       comparator: dateComparator,
                                   }),
                    SortableColumn({
                                       name: "Size",
                                       index: 2,
                                       getCellData,
                                       sortColumn,
                                       isRowSelected,
                                       comparator: sizeComparator,
                                   }),
                ]
            }
        </Table>
    );
}

export default FileList;

function nameComparator(a: FileNode, b: FileNode) {
    if (a.isDirectory) {
        if (!b.isDirectory) {
            return -1;
        }
    } else if (b.isDirectory) {
        return 1;
    }
    return a.name.localeCompare(b.name);
}

function dateComparator(a: FileNode, b: FileNode) {
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


function sizeComparator(a: FileNode, b: FileNode) {
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

