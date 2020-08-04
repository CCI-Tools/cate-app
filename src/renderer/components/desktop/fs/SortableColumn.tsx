import * as React from "react";

import { Menu, MenuItem } from "@blueprintjs/core";
import { Cell, Column, ColumnHeaderCell } from "@blueprintjs/table";


interface ISortableColumnProps {
    name: string;
    index: number;
    getCellData: (rowIndex: number, columnIndex: number) => any;
    sortColumn: (columnIndex: number, comparator: (a: any, b: any) => number) => any;
    comparator: (a: any, b: any) => number;
    cellRenderer?: (rowIndex: number, columnIndex: number) => React.ReactNode;
}

const SortableColumn: React.FC<ISortableColumnProps> = ({name, index, getCellData, sortColumn, comparator}) => {
    const menuRenderer = () => {
        const sortAsc = () => sortColumn(index, comparator);
        const sortDesc = () => sortColumn(index, comparator);
        return (
            <Menu>
                <MenuItem icon="sort-asc" onClick={sortAsc} text="Sort Ascending"/>
                <MenuItem icon="sort-desc" onClick={sortDesc} text="Sort Descending"/>
            </Menu>
        );
    }
    const columnHeaderCellRenderer = () => {
        return (<ColumnHeaderCell name={name} menuRenderer={menuRenderer}/>);
    }
    const cellRenderer = (rowIndex: number, columnIndex: number) => {
        return (<Cell style={{border: 'none', boxShadow: 'none'}}>{getCellData(rowIndex, columnIndex)}</Cell>);
    };
    return (
        <Column
            cellRenderer={cellRenderer}
            columnHeaderCellRenderer={columnHeaderCellRenderer}
            key={index}
            name={name}
        />
    );
};

export default SortableColumn;

