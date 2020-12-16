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