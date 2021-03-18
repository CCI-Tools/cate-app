import * as React from 'react';
import { CSSProperties } from 'react';
import { Colors, Icon, Intent } from '@blueprintjs/core';

import { DataSourceState } from '../state';

import { EcvMeta } from '../ecv-meta';
import _ecvMeta from '../resources/ecv-meta.json';
import { canOpenDataSource } from '../state-util';

const ECV_META: EcvMeta = _ecvMeta;


const ITEM_STYLE: CSSProperties = {display: 'flex', alignItems: 'flex-start'};
const ID_STYLE: CSSProperties = {color: Colors.BLUE5, fontSize: '0.8em'};
const WARN_ICON_STYLE: CSSProperties = {marginRight: 4};
const TYPE_SPEC_STYLE: CSSProperties = {color: Colors.GREEN4, fontSize: '0.8em', marginLeft: 4};
const TEXT_ICON_STYLE: CSSProperties = {
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

interface DataSourceItemProps {
    dataSource: DataSourceState;
    showDataSourceIDs: boolean;
}

const DataSourceItem: React.FC<DataSourceItemProps> = ({dataSource, showDataSourceIDs}) => {
    const metaInfo = dataSource.metaInfo;

    const {backgroundColor, label} = dataSourceToTextIconProps(dataSource);
    const icon = <div style={{...TEXT_ICON_STYLE, backgroundColor}}>{label}</div>;

    const title = dataSource.title || (metaInfo && metaInfo.title);

    const isNotVerified = !canOpenDataSource(dataSource);
    let warnIcon;
    if (isNotVerified) {
        warnIcon = <Icon icon={"warning-sign"} intent={Intent.WARNING} iconSize={16} style={WARN_ICON_STYLE}/>
    }

    let typeSpec;
    if (dataSource.typeSpecifier) {
        typeSpec = <span style={TYPE_SPEC_STYLE}>{dataSource.typeSpecifier}</span>;
    }

    return (
        <div style={ITEM_STYLE}>
            {icon}
            {showDataSourceIDs ? (
                <div>
                    <div className="user-selectable">{warnIcon}{title}{typeSpec}</div>
                    <div className="user-selectable" style={ID_STYLE}>{dataSource.id}</div>
                </div>
            ) : (
                 <span className="user-selectable">{warnIcon}{title}{typeSpec}</span>
             )}
        </div>
    );
}


export default DataSourceItem;


function dataSourceToTextIconProps(dataSource: DataSourceState) {
    let ecvId;
    let label;
    if (dataSource.title) {
        ecvId = dataSource.title.split(' ', 1)[0].toLowerCase();
        label = dataSource.title.substr(0, 3).toUpperCase();
    }
    if (!ecvId || !ECV_META.ecvs[ecvId]) {
        // This is a CCI-store specific hack
        const idParts = dataSource.id.split('.', 2);
        if (idParts.length > 1) {
            ecvId = idParts[1].toLowerCase();
        }
    }
    const ecvMetaItem = ecvId && ECV_META.ecvs[ecvId];
    let backgroundColor;
    if (ecvMetaItem) {
        backgroundColor = ECV_META.colors[ecvMetaItem.color] || ecvMetaItem.color;
        label = ecvMetaItem.label || label;
    }
    if (!backgroundColor) {
        backgroundColor = ECV_META.colors["default"] || "#0BB7A0";
    }
    if (!label) {
        label = (ecvId && ecvId.substr(0, 3).toUpperCase()) || '?';
    }
    return {backgroundColor, label};
}

