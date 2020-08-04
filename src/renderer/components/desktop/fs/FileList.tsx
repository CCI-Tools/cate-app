import { Classes } from '@blueprintjs/core';
import * as React from "react";
import {
    SelectionModes,
    Table,
    Utils,
} from "@blueprintjs/table";
import { FileFilter } from '../types';

import INITIAL_STATE from './data';
import { IFileNode } from './types';
import SortableColumn from './SortableColumn';


interface IFileListProps {
    fileFilter?: FileFilter;
}

const FileList: React.FC<IFileListProps> = ({fileFilter}) => {
    const [fileNodes, setFileNodes] = React.useState<IFileNode[]>(filterFileNodes(INITIAL_STATE, fileFilter));
    const [sortedIndexMap, setSortedIndexMap] = React.useState<number[]>([]);

    const getCellData = (rowIndex: number, columnIndex: number) => {
        const sortedRowIndex = sortedIndexMap[rowIndex];
        if (sortedRowIndex != null) {
            rowIndex = sortedRowIndex;
        }
        const fileNode = fileNodes[rowIndex];
        if (columnIndex === 0) {
            return fileNode.nodeData.name;
        }
        if (columnIndex === 1) {
            return fileNode.nodeData.lastModified;
        }
        if (columnIndex === 2) {
            return fileNode.nodeData.size;
        }
    };

    const sortColumn = (columnIndex: number, comparator: (a: any, b: any) => number) => {
        const sortedIndexMap = Utils.times(fileNodes.length, (i: number) => i);
        const newSortedIndexMap = sortedIndexMap.slice();
        newSortedIndexMap.sort((a: number, b: number) => {
            return comparator(fileNodes[a][columnIndex], fileNodes[b][columnIndex]);
        });
        setSortedIndexMap(newSortedIndexMap);
    };

    return (
        <Table
            numRows={fileNodes.length}
            selectionModes={SelectionModes.ROWS_ONLY}
            enableRowHeader={false}
            enableColumnReordering={false}
            enableColumnResizing={true}
        >
            {
                [
                    SortableColumn({
                                       name: "Name",
                                       index: 0,
                                       getCellData,
                                       sortColumn,
                                       comparator: textComparator
                                   }),
                    SortableColumn({
                                       name: "Last Modified",
                                       index: 1,
                                       getCellData,
                                       sortColumn,
                                       comparator: textComparator
                                   }),
                    SortableColumn({
                                       name: "Size",
                                       index: 2,
                                       getCellData,
                                       sortColumn,
                                       comparator: textComparator
                                   }),
                ]
            }
        </Table>
    );
}

export default FileList;

function textComparator(a: string, b: string) {
    return a.toString().localeCompare(b);
}

function numberComparator(a: number, b: number) {
    return a < b ? -1 : a > b ? 1 : 0;
}

function filterFileNodes(nodes: IFileNode[], filter?: FileFilter): IFileNode[] {
    if (!filter) {
        return nodes;
    }
    const extSet = new Set<string>(filter.extensions);
    if (extSet.has('*')) {
        return nodes;
    }
    return nodes.filter(node => {
        if (node.nodeData.isDirectory) {
            return false;
        }
        const name = node.nodeData.name;
        const index = name.lastIndexOf('.');
        if (index === -1) {
            return false;
        }
        const ext = name.substr(index + 1).toLowerCase();
        return extSet.has(ext);
    });
}