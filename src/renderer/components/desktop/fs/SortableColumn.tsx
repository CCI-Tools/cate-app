import * as React from "react";

import { Colors, Icon, IconName, Menu, MenuItem } from "@blueprintjs/core";
import { Cell, Column, ColumnHeaderCell } from "@blueprintjs/table";


const CELL_DEFAULT_STYLE: React.CSSProperties = {border: 'none', boxShadow: 'none'};
const CELL_SELECTED_STYLE: React.CSSProperties = {...CELL_DEFAULT_STYLE, backgroundColor: Colors.BLUE3};

interface ISortableColumnProps {
    name: string;
    index: number;
    getCellData: (rowIndex: number, columnIndex: number) => any;
    getRowIcon?: (rowIndex: number) => IconName | null;
    isRowSelected?: (rowIndex: number) => boolean;
    sortColumn: (columnIndex: number, comparator: (a: any, b: any) => number) => any;
    comparator: (a: any, b: any) => number;
}

const SortableColumn: React.FC<ISortableColumnProps> = (
    {
        name,
        index,
        getCellData,
        getRowIcon,
        isRowSelected,
        sortColumn,
        comparator,
    }
) => {
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
        const data = getCellData(rowIndex, columnIndex);
        const iconName = getRowIcon && getRowIcon(rowIndex);
        const isSelected = isRowSelected && isRowSelected(rowIndex);
        let content = data;
        if (iconName) {
            content = <span><Icon icon={iconName} iconSize={16}/>&nbsp;{data}</span>;
        }
        return (
            <Cell style={isSelected ? CELL_SELECTED_STYLE : CELL_DEFAULT_STYLE}>
                {content}
            </Cell>
        );
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

