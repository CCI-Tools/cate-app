import * as React from "react";
import { Colors, HTMLTable, Icon, IconName } from '@blueprintjs/core';

import { FileFilter } from '../types';
import { applyFileFilter, compareFileNames, FileNode, getFileNodeIcon, getFileNodePath } from './file-system';

const ROW_DEFAULT_STYLE: React.CSSProperties = {};
const ROW_SELECTED_STYLE: React.CSSProperties = {...ROW_DEFAULT_STYLE, backgroundColor: Colors.BLUE3};

interface IFileListProps {
    fileNodes: FileNode[];
    selectedDirPath?: string | null;

    fileFilter?: FileFilter;
    multiSelections?: boolean;

    selectedPaths?: string[];
    onSelectedPathsChange?: (selectedPaths: string[]) => void;
}

const FileList: React.FC<IFileListProps> = (
    {
        fileNodes,
        fileFilter,
        multiSelections,
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

    if (currentFileNodes) {
        if (fileFilter) {
            currentFileNodes = applyFileFilter(currentFileNodes, fileFilter);
        }
        currentFileNodes = currentFileNodes.sort(compareFileNames);
    }

    const selectedPathSet = new Set(selectedPaths);

    const getRowFileNode = (rowIndex: number): FileNode => {
        const sortedRowIndex = sortedIndexMap[rowIndex];
        if (typeof sortedRowIndex === 'number') {
            rowIndex = sortedRowIndex;
        }
        return currentFileNodes[rowIndex];
    };

    const getRowIcon = (rowIndex: number): IconName | null => {
        return getFileNodeIcon(getRowFileNode(rowIndex));
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

    const handleRowClick = (fileNode: FileNode, rowIndex: number, event: any) => {
        const path = getRowPath(rowIndex);
        const newSelectedPathSet = new Set<string>(selectedPathSet);
        if (newSelectedPathSet.has(path)) {
            newSelectedPathSet.delete(path);
        } else {
            if (multiSelections) {
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

    return (
        <div style={{height: '100%', overflow: 'auto'}}>
            <HTMLTable className="bp3-html-table-condensed bp3-interactive" style={{width: '100%'}}>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th>Size</th>
                </tr>
                </thead>
                <tbody>
                {
                    currentFileNodes.map((node, rowIndex) => {
                        return (
                            <tr
                                style={isRowSelected(rowIndex) ? ROW_SELECTED_STYLE : ROW_DEFAULT_STYLE}
                                onClick={(e) => handleRowClick(node, rowIndex, e)}
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

/*

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

 */