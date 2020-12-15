import {
    AnchorButton,
    ButtonGroup,
    Callout,
    Card,
    Checkbox,
    Classes,
    Collapse,
    Colors,
    H5,
    HTMLSelect,
    IconName,
    InputGroup,
    Intent,
    Label,
    Popover,
    PopoverInteractionKind,
    Position,
    Tab,
    Tabs,
    Tag,
    Tooltip
} from '@blueprintjs/core';
import { Cell, Column, Table, TruncatedFormat } from '@blueprintjs/table';
import * as React from 'react';
import { CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { ContentWithDetailsPanel } from '../components/ContentWithDetailsPanel';
import { ListBox, ListBoxSelectionMode } from '../components/ListBox';
import { ScrollablePanelContent } from '../components/ScrollableContent';
import { TextWithLinks } from '../components/TextWithLinks';
import { ToolButton } from '../components/ToolButton';
import { EcvMeta } from '../ecv-meta';
import { DATA_SOURCES_LOADING, NO_DATA_SOURCES_FOUND, NO_DATA_STORES_FOUND, NO_LOCAL_DATA_SOURCES } from '../messages';

import _ecvMeta from '../resources/ecv-meta.json';
import * as selectors from '../selectors';
import { DataSourceState, DataStoreNotice, DataStoreState, State } from '../state';
import { canOpenDataSource, isLocalDataStore } from '../state-util';
import AddDatasetDialog from './AddDatasetDialog';
import OpenDatasetDialog from './OpenDatasetDialog';
import RemoveDatasetDialog from './RemoveDatasetDialog';


const ECV_META: EcvMeta = _ecvMeta;

const USE_OLD_CCI_ICONS = false;

const INTENTS = {
    'default': Intent.NONE,
    'primary': Intent.PRIMARY,
    'success': Intent.SUCCESS,
    'warning': Intent.WARNING,
    'danger': Intent.DANGER,
};

interface IDataSourcesPanelProps {
    hasWorkspace: boolean;
    dataStores: Array<DataStoreState>;
    dataSourceFilterExpr: string;
    selectedDataStore: DataStoreState | null;
    selectedDataSource: DataSourceState | null;
    selectedDataSources: DataSourceState[] | null;
    filteredDataSources: DataSourceState[] | null;
    dataSourceListHeight: number;
    showAllDataSources: boolean;
    showDataSourceIDs: boolean;
    showDataSourceDetails: boolean;
    showDataStoreDescription: boolean;
    showDataStoreNotices: boolean;
    offlineMode: boolean;
}

function mapStateToProps(state: State): IDataSourcesPanelProps {
    return {
        hasWorkspace: !!selectors.workspaceSelector(state),
        dataStores: selectors.dataStoresSelector(state),
        dataSourceFilterExpr: selectors.dataSourceFilterExprSelector(state),
        selectedDataStore: selectors.selectedDataStoreSelector(state),
        selectedDataSource: selectors.selectedDataSourceSelector(state),
        selectedDataSources: selectors.selectedDataSourcesSelector(state),
        filteredDataSources: selectors.filteredDataSourcesSelector(state),
        dataSourceListHeight: selectors.dataSourceListHeightSelector(state),
        showDataSourceDetails: selectors.showDataSourceDetailsSelector(state),
        showAllDataSources: selectors.showAllDataSourcesSelector(state),
        showDataSourceIDs: selectors.showDataSourceIDsSelector(state),
        showDataStoreDescription: selectors.showDataStoreDescriptionSelector(state),
        showDataStoreNotices: selectors.showDataStoreNoticesSelector(state),
        offlineMode: selectors.offlineModeSelector(state),
    };
}

interface IDataSourcesPanelDispatch {
    setSelectedDataStoreId(selectedDataStoreId: string): void;

    setSelectedDataSourceId(selectedDataSourceId: string): void;

    setDataSourceFilterExpr(dataSourceFilterExpr: string): void;

    setControlState(propertyName: string, value: any): void;

    setSessionState(propertyName: string, value: any): void;

    updateSessionState(sessionState: any): void;

    loadTemporalCoverage(dataStoreId: string, dataSourceId: string): void;

    showDialog(dialogId: string): void;

    hideDialog(dialogId: string): void;
}

const mapDispatchToProps = {
    setSelectedDataStoreId: actions.setSelectedDataStoreId,
    setSelectedDataSourceId: actions.setSelectedDataSourceId,
    setDataSourceFilterExpr: actions.setDataSourceFilterExpr,
    setSessionState: actions.setSessionProperty,
    setControlState: actions.setControlProperty,
    updateSessionState: actions.updateSessionState,
    loadTemporalCoverage: actions.loadTemporalCoverage,
    showDialog: actions.showDialog,
    hideDialog: actions.hideDialog,
};

/**
 * The DataSourcesPanel is used browse and open data data sources originating from a selected data store.
 *
 * @author Norman Fomferra
 */
class DataSourcesPanel extends React.Component<IDataSourcesPanelProps & IDataSourcesPanelDispatch, null> {

    private static readonly FLEX_ROW_STYLE: CSSProperties = {display: 'flex', alignItems: 'center', marginBottom: 1};
    private static readonly SPACER_STYLE: CSSProperties = {flex: 1};
    private static readonly LABEL_STYLE: CSSProperties = {margin: '0 0.5em 0 0', display: 'flex', flexGrow: 1};
    private static readonly LABEL_TEXT_STYLE: CSSProperties =
        {minWidth: '5em', overflow: 'hidden', whiteSpace: 'nowrap'};
    private static readonly SELECT_STYLE: CSSProperties = {flexGrow: 1};

    constructor(props: IDataSourcesPanelProps & IDataSourcesPanelDispatch) {
        super(props);
        this.handleAddDatasetDialog = this.handleAddDatasetDialog.bind(this);
        this.handleRemoveDatasetDialog = this.handleRemoveDatasetDialog.bind(this);
        this.handleShowOpenDatasetDialog = this.handleShowOpenDatasetDialog.bind(this);
        this.handleListHeightChanged = this.handleListHeightChanged.bind(this);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleDataStoreSelected = this.handleDataStoreSelected.bind(this);
        this.handleShowDataStoreDescriptionChanged = this.handleShowDataStoreDescriptionChanged.bind(this);
        this.handleShowDataStoreNoticesChanged = this.handleShowDataStoreNoticesChanged.bind(this);
        this.handleShowAllDataSourcesChanged = this.handleShowAllDataSourcesChanged.bind(this);
        this.handleShowDataSourceIDsChanged = this.handleShowDataSourceIDsChanged.bind(this);
    }

    render() {
        const hasDataStores = this.props.dataStores && this.props.dataStores.length;
        if (!hasDataStores) {
            return this.renderNoDataStoreMessage();
        }
        const hasDataSources = this.props.selectedDataSources && this.props.selectedDataSources.length;
        const selectedDataSource = this.props.selectedDataSource;
        const isLocalStore = isLocalDataStore(this.props.selectedDataStore);
        const canAdd = isLocalStore;
        const canRemove = selectedDataSource && isLocalStore;
        const isNotVerified = selectedDataSource ? !canOpenDataSource(selectedDataSource) : false;
        const canOpen = selectedDataSource && this.props.hasWorkspace && !isNotVerified;
        const actionComponent = (
            <ButtonGroup>
                {isLocalStore && <ToolButton
                    tooltipContent="Add data source"
                    onClick={this.handleAddDatasetDialog}
                    disabled={!canAdd}
                    icon="add"
                    tooltipPosition={'top'}
                />}
                {isLocalStore && <ToolButton
                    tooltipContent="Remove data source"
                    onClick={this.handleRemoveDatasetDialog}
                    disabled={!canRemove}
                    icon="trash"
                    tooltipPosition={'top'}
                />}
                {isNotVerified && (
                    <Popover
                        popoverClassName={Classes.POPOVER_CONTENT_SIZING}
                        enforceFocus={false}
                        interactionKind={PopoverInteractionKind.HOVER}
                        position={Position.TOP}
                    >
                        <ToolButton icon={"warning-sign"} intent={Intent.WARNING}/>
                        <div>
                            <H5>Cannot open from Store</H5>
                            <p>This data source cannot be opened directly
                                from its data store. You may download it
                                manually and use one of the <code>read_xxx()</code>
                                operations to open the downloaded data.
                                "xxx" is determined by the type and format
                                of the data."
                            </p>
                            <p>
                                More information related to the data
                                can be found <a href={"https://www.startpage.com/"}>here</a>.
                            </p>
                        </div>
                    </Popover>
                )}
                <ToolButton
                    tooltipContent="Open data source"
                    intent={Intent.PRIMARY}
                    onClick={this.handleShowOpenDatasetDialog}
                    disabled={!canOpen}
                    icon={"folder-shared-open"}
                    tooltipPosition={'top'}
                />
                <AddDatasetDialog/>
                <RemoveDatasetDialog/>
                <OpenDatasetDialog/>
            </ButtonGroup>
        );
        return (
            <div>
                {this.renderDataStoreSelector()}
                <div style={DataSourcesPanel.FLEX_ROW_STYLE}>
                    <span style={DataSourcesPanel.SPACER_STYLE}/>
                    <Tooltip content={
                        <div>
                            List also datasets that cannot be opened directly.<br/>
                            Usually they can be downloaded manually, then<br/>
                            opened by some <code>read_xxx()</code> operation.
                        </div>}>
                        <Checkbox
                            label="All data sources"
                            checked={this.props.showAllDataSources}
                            onChange={this.handleShowAllDataSourcesChanged}
                            style={{marginBottom: 2, marginTop: 6, marginRight: 6}}
                        />
                    </Tooltip>
                    <Checkbox
                        label="Show identifiers"
                        checked={this.props.showDataSourceIDs}
                        onChange={this.handleShowDataSourceIDsChanged}
                        style={{marginBottom: 2, marginTop: 6}}
                    />
                </div>
                {this.renderDataSourceFilterExprInput()}
                <ContentWithDetailsPanel
                    showDetails={this.props.showDataSourceDetails}
                    onShowDetailsChange={this.handleShowDetailsChanged}
                    isSplitPanel={true}
                    contentHeight={this.props.dataSourceListHeight}
                    onContentHeightChange={this.handleListHeightChanged}
                    actionComponent={actionComponent}
                >
                    {hasDataSources
                     ? (<DataSourcesList
                            dataSources={this.props.filteredDataSources}
                            selectedDataSourceId={this.props.selectedDataSource
                                                  ? this.props.selectedDataSource.id
                                                  : null}
                            setSelectedDataSourceId={this.props.setSelectedDataSourceId}
                            showDataSourceIDs={this.props.showDataSourceIDs}
                            doubleClickAction={this.handleShowOpenDatasetDialog}
                        />)
                     : this.renderNoDataSourcesMessage()
                    }
                    <DataSourceDetails dataSource={this.props.selectedDataSource}/>
                </ContentWithDetailsPanel>
            </div>
        );
    }

    private handleAddDatasetDialog() {
        this.props.showDialog('addDatasetDialog');
    }

    private handleRemoveDatasetDialog() {
        this.props.showDialog('removeDatasetDialog');
    }

    private handleShowOpenDatasetDialog() {
        this.maybeLoadTemporalCoverage();
        this.props.showDialog('openDatasetDialog');
    }

    private maybeLoadTemporalCoverage() {
        if (!this.props.selectedDataSource.temporalCoverage) {
            this.props.loadTemporalCoverage(this.props.selectedDataStore.id, this.props.selectedDataSource.id);
        }
    }

    private handleDataStoreSelected(event) {
        const dataStoreId = event.target.value;
        this.props.setSelectedDataStoreId(dataStoreId);
    }

    private handleListHeightChanged(value: number) {
        this.props.setSessionState('dataSourceListHeight', value);
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.setSessionState('showDataSourceDetails', value);
    }

    private handleShowDataStoreDescriptionChanged() {
        this.props.updateSessionState({showDataStoreDescription: !this.props.showDataStoreDescription});
    }

    private handleShowDataStoreNoticesChanged() {
        this.props.updateSessionState({showDataStoreNotices: !this.props.showDataStoreNotices});
    }

    private handleShowAllDataSourcesChanged(ev: any) {
        this.props.updateSessionState({showAllDataSources: ev.target.checked});
    }

    private handleShowDataSourceIDsChanged(ev: any) {
        this.props.updateSessionState({showDataSourceIDs: ev.target.checked});
    }

    private renderDataSourceFilterExprInput() {
        const resultsTag = (
            <Tag className={Classes.MINIMAL} onRemove={() => this.props.setDataSourceFilterExpr('')}>
                {this.props.filteredDataSources && this.props.filteredDataSources.length}
            </Tag>
        );

        return (
            <div style={{paddingBottom: 2}}>
                <InputGroup
                    disabled={false}
                    leftIcon="filter"
                    onChange={(event) => this.props.setDataSourceFilterExpr(event.target.value)}
                    placeholder="Find data source"
                    rightElement={resultsTag}
                    value={this.props.dataSourceFilterExpr}
                />
            </div>
        );
    }

    private renderDataStoreSelector() {
        if (!this.props.dataStores || !this.props.dataStores.length) {
            return null;
        }

        const dataStoreOptions = [];
        for (let dataStore of this.props.dataStores) {
            dataStoreOptions.push(
                <option key={dataStore.id} value={dataStore.id}>{dataStore.title || dataStore.id}</option>
            );
        }

        const {selectedDataStore, showDataStoreDescription, /*showDataStoreNotices*/} = this.props;

        const hasDataStoreDescription = selectedDataStore && selectedDataStore.description;
        const hasDataStoreNotices = selectedDataStore && selectedDataStore.notices && selectedDataStore.notices.length;

        let dataStoreDescriptionElement;
        if (hasDataStoreDescription) {
            dataStoreDescriptionElement = (
                <Collapse isOpen={showDataStoreDescription}>
                    <Card>
                        {this.renderMarkdown(selectedDataStore.description)}
                    </Card>
                </Collapse>
            );
        }

        // let dataStoreNoticesElement;
        if (hasDataStoreNotices) {
            const callouts = [];
            selectedDataStore.notices.forEach((notice: DataStoreNotice) => {
                callouts.push(
                    <div key={notice.id} style={{margin: '0 4px 4px 4px'}}>
                        <Callout
                            title={notice.title}
                            icon={notice.icon as IconName}
                            intent={notice.intent in INTENTS ? INTENTS[notice.intent] : Intent.NONE}
                        >
                            {this.renderMarkdown(notice.content)}
                        </Callout>
                    </div>
                );
            });
            // dataStoreNoticesElement = (<Collapse isOpen={showDataStoreNotices}>{callouts}</Collapse>);
        }

        // TODO (forman): BP3: use new Select component

        //  a label has by default a 15px margin at the bottom
        return (
            <React.Fragment>
                <div style={DataSourcesPanel.FLEX_ROW_STYLE}>
                    <Label className="bp3-inline"
                           style={DataSourcesPanel.LABEL_STYLE}>
                        <span style={DataSourcesPanel.LABEL_TEXT_STYLE}>Data store:</span>
                        <HTMLSelect
                            fill={true}
                            style={DataSourcesPanel.SELECT_STYLE}
                            value={selectedDataStore ? selectedDataStore.id : ''}
                            onChange={this.handleDataStoreSelected}
                        >
                            {dataStoreOptions}
                        </HTMLSelect>
                    </Label>
                    <ButtonGroup>
                        <ToolButton
                            tooltipContent="Show/hide data store description"
                            onClick={this.handleShowDataStoreDescriptionChanged}
                            disabled={!hasDataStoreDescription}
                            active={showDataStoreDescription}
                            icon="help"
                            tooltipPosition={'top'}
                        />
                        {/*This was an ESA requirement long time ago. It may no longer apply.*/}
                        {/*<ToolButton*/}
                        {/*    tooltipContent="Show/hide data store notices"*/}
                        {/*    onClick={this.handleShowDataStoreNoticesChanged}*/}
                        {/*    disabled={!hasDataStoreNotices}*/}
                        {/*    active={showDataStoreNotices}*/}
                        {/*    icon="notifications"*/}
                        {/*    tooltipPosition={'top'}*/}
                        {/*/>*/}
                    </ButtonGroup>
                </div>

                {dataStoreDescriptionElement}

                {/*This was an ESA requirement long time ago. It may no longer apply.*/}
                {/*{dataStoreNoticesElement}*/}

            </React.Fragment>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderNoDataStoreMessage() {
        return NO_DATA_STORES_FOUND;
    }

    //noinspection JSMethodCanBeStatic
    private renderNoDataSourcesMessage() {
        const selectedDataStore = this.props.selectedDataStore;
        if (isLocalDataStore(selectedDataStore)) {
            return NO_LOCAL_DATA_SOURCES;
        } else {
            const selectedDataSources = this.props.selectedDataSources;
            if (selectedDataSources === null) {
                return DATA_SOURCES_LOADING;
            } else {
                return NO_DATA_SOURCES_FOUND;
            }
        }
    }

    //noinspection JSMethodCanBeStatic
    private renderMarkdown(source: string) {
        return <ReactMarkdown renderers={MARKDOWN_RENDERERS} source={source}/>
    }
}

/**
 * Allow Markdown text elements to be user-selectable.
 */
class MarkdownText extends React.PureComponent<any> {
    render() {
        return <span className="user-selectable">{this.props.value}</span>
    }
}

/**
 * Allow Markdown inline code elements to be user-selectable.
 */
class MarkdownInlineCode extends React.PureComponent<any> {
    static readonly SPAN_STYLE = {
        fontFamily: 'Source Code Pro, Consolas, monospace',
        color: Colors.LIGHT_GRAY1,
    };

    render() {
        return <span className="user-selectable" style={MarkdownInlineCode.SPAN_STYLE}>{this.props.value}</span>
    }
}

/**
 * Allow Markdown code elements to be user-selectable.
 */
class MarkdownCode extends React.PureComponent<any> {

    render() {
        return <pre className="user-selectable">{this.props.value}</pre>
    }
}

const MARKDOWN_RENDERERS = {text: MarkdownText, inlineCode: MarkdownInlineCode, code: MarkdownCode};


interface IDataSourcesListProps {
    dataSources: DataSourceState[];
    selectedDataSourceId: string | null;
    setSelectedDataSourceId: (selectedDataSourceId: string) => void;
    showDataSourceIDs: boolean;
    doubleClickAction: (dataSource: DataSourceState) => any;
}

class DataSourcesList extends React.PureComponent<IDataSourcesListProps, null> {
    static readonly ITEM_DIV_STYLE: CSSProperties = {display: 'flex', alignItems: 'flex-start'};
    static readonly ID_DIV_STYLE: CSSProperties = {color: Colors.GREEN4, fontSize: '0.8em'};
    static readonly ICON_DIV_STYLE: CSSProperties = {width: 32, height: 32, flex: 'none', marginRight: 6};
    static readonly TEXT_ICON_DIV_STYLE: CSSProperties = {
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
    readonly defaultIconName = 'cci';

    constructor(props: IDataSourcesListProps) {
        super(props);
        this.renderIcon = this.renderIcon.bind(this);
        this.renderTextIcon = this.renderTextIcon.bind(this);
        this.renderDataSourceTitle = this.renderDataSourceTitle.bind(this);
        this.handleDataSourceSelected = this.handleDataSourceSelected.bind(this);
        this.handleIconLoadError = this.handleIconLoadError.bind(this);
    }

    private static getItemKey(dataSource: DataSourceState) {
        return dataSource.id;
    }

    render() {
        return (
            <ScrollablePanelContent>
                <ListBox
                    // key is here to force re-render on change of showDataSourceIDs
                    key={'DataSourcesList-' + this.props.showDataSourceIDs}
                    items={this.props.dataSources}
                    getItemKey={DataSourcesList.getItemKey}
                    renderItem={this.renderDataSourceTitle}
                    selectionMode={ListBoxSelectionMode.SINGLE}
                    selection={this.props.selectedDataSourceId}
                    onItemDoubleClick={this.props.doubleClickAction}
                    onSelection={this.handleDataSourceSelected}
                />
            </ScrollablePanelContent>
        );
    }

    private handleDataSourceSelected(newSelection: Array<React.Key>) {
        if (newSelection.length > 0) {
            this.props.setSelectedDataSourceId(newSelection[0] as string);
        } else {
            this.props.setSelectedDataSourceId(null);
        }
    }

    private handleIconLoadError(img) {
        img.onError = null;
        img.src = `resources/images/data-sources/esacci/${this.defaultIconName}.png`;
    }

    private renderIcon(dataSource: DataSourceState) {
        const icon = ((dataSource.meta_info && dataSource.meta_info.cci_project) || 'cci').toLowerCase();
        return <img src={`resources/images/data-sources/esacci/${icon}.png`}
                    style={DataSourcesList.ICON_DIV_STYLE}
                    alt="cci icon"
                    onError={this.handleIconLoadError}/>
    }

    // noinspection JSMethodCanBeStatic
    private renderTextIcon(dataSource: DataSourceState) {
        const ecvId = ((dataSource.meta_info && dataSource.meta_info.cci_project) || '').toLowerCase();
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
        return <div style={{...DataSourcesList.TEXT_ICON_DIV_STYLE, backgroundColor}}>{label}</div>;
    }

    private renderDataSourceTitle(dataSource: DataSourceState) {
        const title = dataSource.title || (dataSource.meta_info && dataSource.meta_info.title);
        return (
            <div style={DataSourcesList.ITEM_DIV_STYLE}>
                {USE_OLD_CCI_ICONS ? this.renderIcon(dataSource) : this.renderTextIcon(dataSource)}
                {this.props.showDataSourceIDs ? (
                    <div>
                        <div className="user-selectable">{title}</div>
                        <div className="user-selectable" style={DataSourcesList.ID_DIV_STYLE}>{dataSource.id}</div>
                    </div>
                ) : (
                     <span className="user-selectable">{title}</span>
                 )}
            </div>
        );
    }
}

interface DetailPart {
    title: string;
    id: string;
    element: JSX.Element;
}

interface IDataSourceDetailsProps {
    dataSource: DataSourceState
}

class DataSourceDetails extends React.PureComponent<IDataSourceDetailsProps, null> {

    constructor(props: IDataSourceDetailsProps) {
        super(props);
        this.renderAbstract = this.renderAbstract.bind(this);
    }

    private static renderVariablesTable(variables?: any[]): DetailPart {
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

    private static renderMetaInfoTable(metaInfo?: any, metaInfoKeys?: string[]): DetailPart {
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

    private static renderMetaInfoLicences(metaInfo: any): DetailPart {
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

    render() {
        const dataSource = this.props.dataSource;
        if (!dataSource) {
            return null;
        }
        let metaInfoKeys;
        if (dataSource.meta_info) {
            metaInfoKeys = Object.keys(dataSource.meta_info).filter(key => key !== 'variables');
        }
        let variables;
        if (dataSource.meta_info.variables) {
            variables = dataSource.meta_info.variables;
        }

        const details: DetailPart[] = [];
        details.push(this.renderAbstract(dataSource));
        details.push(DataSourceDetails.renderVariablesTable(variables));
        details.push(DataSourceDetails.renderMetaInfoTable(dataSource.meta_info, metaInfoKeys));
        details.push(DataSourceDetails.renderMetaInfoLicences(dataSource.meta_info));

        return (
            <Tabs id="dsDetails" renderActiveTabPanelOnly={true}>
                {details.map(d => <Tab key={d.id} id={d.id} title={d.title} panel={d.element}/>)}
            </Tabs>
        );
    }

    private renderAbstract(dataSource: DataSourceState): DetailPart {
        const metaInfo = dataSource.meta_info;
        let element;
        if (metaInfo) {
            const catalogUrl = metaInfo.catalog_url || (metaInfo.uuid ? `https://catalogue.ceda.ac.uk/${metaInfo.uuid}` : null);
            let openOdpPage;
            if (catalogUrl) {
                openOdpPage =
                    <AnchorButton onClick={() => actions.openExternal(catalogUrl)}
                                  style={{float: 'right', margin: 4}}>Catalogue</AnchorButton>
            }
            let spatialCoverage;
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
            let temporalCoverage;
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
            let summary;
            if (metaInfo.abstract) {
                summary = (
                    <div><h5>Summary</h5>
                        <p className="user-selectable"><TextWithLinks>{metaInfo.abstract}</TextWithLinks></p>
                    </div>
                );
            }
            if (openOdpPage || spatialCoverage || temporalCoverage || summary) {
                element = (
                    <ScrollablePanelContent>
                        <Card>
                            {openOdpPage}
                            {spatialCoverage}
                            {temporalCoverage}
                            {summary}
                        </Card>
                    </ScrollablePanelContent>
                );
            }
        }

        if (!element) {
            element = <Card>No abstract available.</Card>;
        }

        return {title: 'Abstract', id: 'abstract', element};
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(DataSourcesPanel as any);
