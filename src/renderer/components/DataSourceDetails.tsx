import * as React from 'react';
import { Card, Tab, Tabs } from '@blueprintjs/core';
import { Cell, Column, Table, TruncatedFormat } from '@blueprintjs/table';

import { DataSourceState } from '../state';
import DataSourceLinks from './DataSourceLinks';
import Markdown from './Markdown';
import { ScrollablePanelContent } from './ScrollableContent';


const COVERAGE_PANEL_STYLE: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
};

interface DetailPart {
    title: string;
    id: string;
    element: JSX.Element;
}

interface IDataSourceDetailsProps {
    dataSource: DataSourceState
}

const DataSourceDetails: React.FC<IDataSourceDetailsProps> = ({dataSource}) => {

    if (!dataSource) {
        return null;
    }

    let metaInfoKeys;
    let variables;

    const metaInfo = dataSource.metaInfo;

    if (metaInfo) {
        metaInfoKeys = Object.keys(metaInfo).filter(key => key !== 'variables');
        if (metaInfo.variables) {
            variables = metaInfo.variables;
        }
    }

    const details: DetailPart[] = [
        renderAbstract(dataSource),
        renderVariablesTable(variables),
        renderMetaInfoTable(metaInfo, metaInfoKeys),
        renderMetaInfoLicences(metaInfo),
    ];

    return (
        <Tabs id="dsDetails" renderActiveTabPanelOnly={true}>
            {details.map(d => <Tab key={d.id} id={d.id} title={d.title} panel={d.element}/>)}
        </Tabs>
    );
}

export default DataSourceDetails;


function renderAbstract(dataSource: DataSourceState): DetailPart {

    const metaInfo = dataSource.metaInfo;

    let spatialCoverage;
    let temporalCoverage;
    let summary;
    if (metaInfo) {
        if (Array.isArray(metaInfo.bbox)) {
            const [x_min, y_min, x_max, y_max] = metaInfo.bbox;
            spatialCoverage = (
                <div>
                    <h5>Spatial coverage</h5>
                    <table>
                        <tbody>
                        <tr>
                            <td/>
                            <td className="user-selectable">{y_max}&#176;</td>
                            <td/>
                        </tr>
                        <tr>
                            <td className="user-selectable">{x_min}&#176;</td>
                            <td/>
                            <td className="user-selectable">{x_max}&#176;</td>
                        </tr>
                        <tr>
                            <td/>
                            <td className="user-selectable">{y_min}&#176;</td>
                            <td/>
                        </tr>
                        </tbody>
                    </table>
                    <br/>
                </div>
            );
        }
        if (dataSource.metaInfo && dataSource.metaInfo.time_range) {
            let [start, end] = dataSource.metaInfo.time_range;
            if (!start && !end) {
                start = end = 'unknown';
            } else if (!start) {
                start = 'unknown';
            } else if (!end) {
                end = 'today';
            }
            temporalCoverage = (
                <div><h5>Temporal coverage</h5>
                    <table>
                        <tbody>
                        <tr>
                            <td>Start</td>
                            <td className="user-selectable">{start}</td>
                        </tr>
                        <tr>
                            <td>End</td>
                            <td className="user-selectable">{end}</td>
                        </tr>
                        </tbody>
                    </table>
                    <br/>
                </div>
            );
        }
        if (metaInfo.abstract) {
            summary = (
                <div><h5>Summary</h5>
                    <Markdown source={metaInfo.abstract}/>
                </div>
            );
        }
    }

    let element;
    if (spatialCoverage || temporalCoverage || summary) {
        element = (
            <ScrollablePanelContent>
                <Card>
                    <DataSourceLinks dataSource={dataSource}/>
                    <div style={COVERAGE_PANEL_STYLE}>
                        {spatialCoverage}
                        {temporalCoverage}
                    </div>
                    {summary}
                </Card>
            </ScrollablePanelContent>
        );
    } else {
        element = (
            <Card>
                <DataSourceLinks dataSource={dataSource}/>
                <p>No abstract available.</p>
            </Card>
        );
    }

    return {title: 'Abstract', id: 'abstract', element};
}

function renderVariablesTable(variables?: any[]): DetailPart {
    let element;
    if (variables && variables.length > 0) {
        const renderName = (rowIndex: number) => {
            const variable = variables[rowIndex];
            return (
                <Cell tooltip={variable.long_name}>
                    <TruncatedFormat className="user-selectable">{variable.name}</TruncatedFormat>
                </Cell>
            );
        };

        const renderUnit = (rowIndex: number) => {
            const variable = variables[rowIndex];
            return (
                <Cell>
                    <TruncatedFormat className="user-selectable">{variable.units || '-'}</TruncatedFormat>
                </Cell>
            );
        };

        const getCellClipboardData = (row: number, col: number) => {
            console.log('getCellClipboardData: ', row, col);
        };

        element = (
            <Table numRows={variables.length}
                   enableRowHeader={false}
                   getCellClipboardData={getCellClipboardData}>
                <Column name="Name" cellRenderer={renderName}/>
                <Column name="Units" cellRenderer={renderUnit}/>
            </Table>
        );
    } else {
        element = <Card>No information about variables available.</Card>;
    }
    return {title: 'Variables', id: 'var', element};
}

function renderMetaInfoTable(metaInfo?: any, metaInfoKeys?: string[]): DetailPart {
    let element;
    if (metaInfo && metaInfoKeys) {

        const renderKey = (rowIndex: number) => {
            const key = metaInfoKeys[rowIndex];
            return <Cell><TruncatedFormat>{key}</TruncatedFormat></Cell>;
        };

        const renderValue = (rowIndex: number) => {
            const key = metaInfoKeys[rowIndex];
            return <Cell><TruncatedFormat>{metaInfo[key]}</TruncatedFormat></Cell>;
        };

        const getCellClipboardData = (row: number, col: number) => {
            console.log('getCellClipboardData: ', row, col);
        };

        element = (
            <Table numRows={metaInfoKeys.length}
                   enableRowHeader={false}
                   getCellClipboardData={getCellClipboardData}>
                <Column name="Key" cellRenderer={renderKey}/>
                <Column name="Value" cellRenderer={renderValue}/>
            </Table>
        );
    } else {
        element = <Card>No global meta-information available.</Card>;
    }

    return {title: 'Meta-Info', id: 'meta', element};
}

function renderMetaInfoLicences(metaInfo: any): DetailPart {
    let element;
    if (metaInfo && metaInfo.licences) {
        element = (
            <div>
                <Markdown source={metaInfo.licences}/>
            </div>
        );
    } else {
        element = <Card>No license information available.</Card>;
    }
    return {title: 'Licences', id: 'licences', element};
}
