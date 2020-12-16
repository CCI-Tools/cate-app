import * as React from 'react';
import { Card, Tab, Tabs } from '@blueprintjs/core';
import { Cell, Column, Table, TruncatedFormat } from '@blueprintjs/table';

import { DataSourceState } from '../state';
import DataSourceLinks from './DataSourceLinks';
import { ScrollablePanelContent } from './ScrollableContent';
import { TextWithLinks } from './TextWithLinks';


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
    if (dataSource.metaInfo) {
        metaInfoKeys = Object.keys(dataSource.metaInfo).filter(key => key !== 'variables');
    }
    let variables;
    if (dataSource.metaInfo.variables) {
        variables = dataSource.metaInfo.variables;
    }

    const details: DetailPart[] = [
        renderAbstract(dataSource),
        renderVariablesTable(variables),
        renderMetaInfoTable(dataSource.metaInfo, metaInfoKeys),
        renderMetaInfoLicences(dataSource.metaInfo),
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
        if (metaInfo.bbox_miny && metaInfo.bbox_maxy && metaInfo.bbox_minx && metaInfo.bbox_maxx) {
            spatialCoverage = (
                <div>
                    <h5>Spatial coverage</h5>
                    <table>
                        <tbody>
                        <tr>
                            <td/>
                            <td className="user-selectable">{metaInfo.bbox_maxy}&#176;</td>
                            <td/>
                        </tr>
                        <tr>
                            <td className="user-selectable">{metaInfo.bbox_minx}&#176;</td>
                            <td/>
                            <td className="user-selectable">{metaInfo.bbox_maxx}&#176;</td>
                        </tr>
                        <tr>
                            <td/>
                            <td className="user-selectable">{metaInfo.bbox_miny}&#176;</td>
                            <td/>
                        </tr>
                        </tbody>
                    </table>
                    <br/>
                </div>
            );
        }
        if (dataSource.temporalCoverage) {
            temporalCoverage = (
                <div><h5>Temporal coverage</h5>
                    <table>
                        <tbody>
                        <tr>
                            <td>Start</td>
                            <td className="user-selectable">{dataSource.temporalCoverage[0]}</td>
                        </tr>
                        <tr>
                            <td>End</td>
                            <td className="user-selectable">{dataSource.temporalCoverage[1]}</td>
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
                    <p className="user-selectable"><TextWithLinks>{metaInfo.abstract}</TextWithLinks></p>
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
                    {spatialCoverage}
                    {temporalCoverage}
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
                <p className="user-selectable"><TextWithLinks>{metaInfo.licences}</TextWithLinks></p>
            </div>
        );
    } else {
        element = <Card>No license information available.</Card>;
    }
    return {title: 'Licences', id: 'licences', element};
}
