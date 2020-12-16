import * as React from 'react';
import { H5 } from '@blueprintjs/core';
import { DataSourceState } from '../state';
import DataSourceLinks from '../components/DataSourceLinks';

interface DataSourceOpenHintProps {
    dataSource: DataSourceState;
    isSandboxedMode: boolean;
}

const DataSourceOpenHint: React.FC<DataSourceOpenHintProps> = (
    {
        dataSource,
        isSandboxedMode,
    }
) => {

    let manualInterventionNotice;
    if (isSandboxedMode) {
        manualInterventionNotice = (
            <p>This data source cannot be opened directly from its data store.
                You may
                <ol>
                    <li>Download it manually to your computer;</li>
                    <li>Upload it using <strong>Files / Upload Files</strong>;</li>
                    <li>Use one of the available <code>read_xxx()</code> operations
                        to open the uploaded data. "xxx" is determined by the type
                        and format of the data.
                    </li>
                </ol>
            </p>
        );
    } else {
        manualInterventionNotice = (
            <p>This data source cannot be opened directly from its data store.
                You may
                <ol>
                    <li>Download it manually to your computer;</li>
                    <li>Use one of the available <code>read_xxx()</code> operations
                        to open the downloaded data. "xxx" is determined by the type
                        and format of the data.
                    </li>
                </ol>
            </p>
        );
    }

    return (
        <div>
            <H5>Manual intervention required</H5>
            {manualInterventionNotice}
            <DataSourceLinks dataSource={dataSource} style={{marginTop: 8}}/>
        </div>
    );
}

export default DataSourceOpenHint;
