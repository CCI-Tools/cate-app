import * as React from 'react';

import { DataSourceState } from '../state';
import DataSourceItem from './DataSourceItem';
import { ListBox, ListBoxSelectionMode } from './ListBox';
import { ScrollablePanelContent } from './ScrollableContent';


interface IDataSourcesListProps {
    dataSources: DataSourceState[];
    selectedDataSourceId: string | null;
    setSelectedDataSourceId: (selectedDataSourceId: string) => void;
    showDataSourceIDs: boolean;
    doubleClickAction: (dataSource: DataSourceState) => any;
}

const DataSourcesList: React.FC<IDataSourcesListProps> = (
    {
        dataSources,
        selectedDataSourceId,
        setSelectedDataSourceId,
        showDataSourceIDs,
        doubleClickAction,
    }
) => {
    const getItemKey = (dataSource: DataSourceState) => {
        return dataSource.id;
    };

    const renderDataSourceItem = (dataSource: DataSourceState) => {
        return <DataSourceItem dataSource={dataSource} showDataSourceIDs={showDataSourceIDs}/>;
    }

    const handleDataSourceSelected = (newSelection: Array<React.Key>) => {
        if (newSelection.length > 0) {
            setSelectedDataSourceId(newSelection[0] as string);
        } else {
            setSelectedDataSourceId(null);
        }
    }

    return (
        <ScrollablePanelContent>
            <ListBox
                // key is here to force re-render on change of showDataSourceIDs
                key={'DataSourcesList-' + showDataSourceIDs}
                items={dataSources}
                getItemKey={getItemKey}
                renderItem={renderDataSourceItem}
                selectionMode={ListBoxSelectionMode.SINGLE}
                selection={selectedDataSourceId}
                onItemDoubleClick={doubleClickAction}
                onSelection={handleDataSourceSelected}
            />
        </ScrollablePanelContent>
    );
}

export default DataSourcesList;

