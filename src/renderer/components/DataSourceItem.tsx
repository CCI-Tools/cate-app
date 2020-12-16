import * as React from 'react';
import { CSSProperties } from 'react';
import { Colors, Icon, Intent } from '@blueprintjs/core';

import { DataSourceState } from '../state';

import { EcvMeta } from '../ecv-meta';
import _ecvMeta from '../resources/ecv-meta.json';
import { canOpenDataSource } from '../state-util';

const ECV_META: EcvMeta = _ecvMeta;


const ITEM_DIV_STYLE: CSSProperties = {display: 'flex', alignItems: 'flex-start'};
const ID_DIV_STYLE: CSSProperties = {color: Colors.GREEN4, fontSize: '0.8em'};
const TEXT_ICON_DIV_STYLE: CSSProperties = {
    width: 32,
    height: 32,
    flex: 'none',
    marginRight: 6,
    borderRadius: 16,
    textAlign: 'center',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};
const WARN_ICON_STYLE: CSSProperties = {marginRight: 4};

interface DataSourceItemProps {
    dataSource: DataSourceState;
    showDataSourceIDs: boolean;
}

const DataSourceItem: React.FC<DataSourceItemProps> = ({dataSource, showDataSourceIDs}) => {
    const metaInfo = dataSource.metaInfo;

    // TODO: get rid of render logic here
    const ecvId = ((metaInfo && metaInfo.cci_project) || '').toLowerCase();
    const ecvMetaItem = ECV_META.ecvs[ecvId];
    let backgroundColor, label;
    if (ecvMetaItem) {
        backgroundColor = ECV_META.colors[ecvMetaItem.color] || ecvMetaItem.color;
        label = ecvMetaItem.label;
    }
    if (!backgroundColor) {
        backgroundColor = ECV_META.colors["default"] || "#0BB7A0";
    }
    if (!label) {
        label = ecvId.substr(0, 3).toUpperCase() || '?';
    }
    const icon = <div style={{...TEXT_ICON_DIV_STYLE, backgroundColor}}>{label}</div>;

    const title = dataSource.title || (metaInfo && metaInfo.title);

    const isNotVerified = !canOpenDataSource(dataSource);
    let warnIcon;
    if (isNotVerified) {
        warnIcon = <Icon icon={"warning-sign"} intent={Intent.WARNING} iconSize={16} style={WARN_ICON_STYLE}/>
    }

    return (
        <div style={ITEM_DIV_STYLE}>
            {icon}
            {showDataSourceIDs ? (
                <div>
                    <div className="user-selectable">{warnIcon}{title}</div>
                    <div className="user-selectable" style={ID_DIV_STYLE}>{dataSource.id}</div>
                </div>
            ) : (
                 <span className="user-selectable">{warnIcon}{title}</span>
             )}
        </div>
    );
}


export default DataSourceItem;