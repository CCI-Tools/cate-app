import * as React from 'react';
import { AnchorButton } from '@blueprintjs/core';

import { DataSourceState } from '../state';
import { getDataSourceUrls } from '../state-util';


interface DataSourceLinksProps {
    dataSource: DataSourceState;
    style?: React.CSSProperties;
}

const DataSourceLinks: React.FC<DataSourceLinksProps> = (
    {
        dataSource,
        style,
    }) => {

    const {catalogUrl, infoUrl} = getDataSourceUrls(dataSource);
    if (!catalogUrl && !infoUrl) {
        return null;
    }

    return (
        <div style={{display: "flex", justifyContent: "flex-end", ...style}}>
            {catalogUrl &&
             <AnchorButton
                 href={catalogUrl}
                 target={"_blank"}
                 style={{float: 'right', margin: 4}}>
                 Catalogue
             </AnchorButton>}
            {infoUrl &&
             <AnchorButton
                 href={infoUrl}
                 target={"_blank"}
                 style={{float: 'right', margin: 4}}>
                 More Info
             </AnchorButton>}
        </div>
    );
}

export default DataSourceLinks;
