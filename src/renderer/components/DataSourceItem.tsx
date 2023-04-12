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
const DATA_TYPE_STYLE: CSSProperties = {color: Colors.GREEN4, fontSize: '0.8em', marginLeft: 4};
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

    let title = dataSource.title || (metaInfo && metaInfo.title);
    if (!title || title === dataSource.id) {
        title = dataSourceToTitle(dataSource);
    }

    const isNotVerified = !canOpenDataSource(dataSource);
    let warnIcon;
    if (isNotVerified) {
        warnIcon = <Icon icon={"warning-sign"} intent={Intent.WARNING} iconSize={16} style={WARN_ICON_STYLE}/>
    }

    let typeSpec;
    if (dataSource.dataType) {
        typeSpec = <span style={DATA_TYPE_STYLE}>{dataSource.dataType}</span>;
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
                 <div className="user-selectable">{warnIcon}{title}{typeSpec}</div>
             )}
        </div>
    );
}


export default DataSourceItem;

const SKIPPED_PREFIXES: string[] = ['esacci '];
const SKIPPED_SUFFIXES: string[] = ['.zarr', '.levels', '.nc', '.tif'];


function dataSourceToTitle(dataSource: DataSourceState) {
    let title = dataSource.id
                            .replace(/-/g, ' ')
                            .replace(/_/g, ' ');
    const lastSlashPos = title.lastIndexOf('/');
    if (lastSlashPos >= 0 && lastSlashPos < title.length - 1) {
        title = title.substring(lastSlashPos + 1)
    }
    for (let prefix of SKIPPED_PREFIXES) {
        if (title.startsWith(prefix) || title.startsWith(prefix.toUpperCase())) {
            title = title.substring(prefix.length);
            break;
        }
    }
    for (let suffix of SKIPPED_SUFFIXES) {
        if (title.endsWith(suffix) || title.endsWith(suffix.toUpperCase())) {
            title = title.substring(0, title.length - suffix.length);
            break;
        }
    }
    return title;
}

function dataSourceToTextIconProps(dataSource: DataSourceState) {
    let ecvId;
    let label;
    const id = dataSource.id.toLowerCase();

    // The following are CCI specific hacks
    if (id.startsWith('esacci.')) {
        const idParts = id.split('.', 2);
        if (idParts.length > 1) {
            ecvId = idParts[1];
        }
    }
    if (!ecvId && id.startsWith('esacci-')) {
        const idParts = id.split('-', 2);
        if (idParts.length > 1) {
            ecvId = idParts[1];
        }
    }
    if (!ecvId) {
        ecvId = id;
    }
    let actualEcvId = ECV_META.mappings[ecvId];
    if (actualEcvId) {
        ecvId = actualEcvId;
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

