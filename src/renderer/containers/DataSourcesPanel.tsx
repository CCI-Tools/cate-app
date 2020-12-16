import * as React from 'react';
import { CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import { connect } from 'react-redux';
import {
    ButtonGroup,
    Callout,
    Card,
    Checkbox,
    Classes,
    Collapse,
    Colors,
    HTMLSelect,
    IconName,
    InputGroup,
    Intent,
    Label,
    Popover,
    PopoverInteractionKind,
    Position,
    Tag,
    Tooltip
} from '@blueprintjs/core';

import * as actions from '../actions';
import { ContentWithDetailsPanel } from '../components/ContentWithDetailsPanel';
import DataSourceDetails from '../components/DataSourceDetails';
import DataSourcesList from '../components/DataSourcesList';
import DataSourceOpenHint from '../components/DataSourceOpenHint';
import { ToolButton } from '../components/ToolButton';
import { DATA_SOURCES_LOADING, NO_DATA_SOURCES_FOUND, NO_DATA_STORES_FOUND, NO_LOCAL_DATA_SOURCES } from '../messages';

import * as selectors from '../selectors';
import { DataSourceState, DataStoreNotice, DataStoreState, State } from '../state';
import { canOpenDataSource, isLocalDataStore } from '../state-util';
import AddDatasetDialog from './AddDatasetDialog';
import OpenDatasetDialog from './OpenDatasetDialog';
import RemoveDatasetDialog from './RemoveDatasetDialog';


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
    isSandboxedMode: boolean;
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
        isSandboxedMode: !selectors.isLocalFSAccessAllowedSelector(state),
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
                        <DataSourceOpenHint
                            isSandboxedMode={this.props.isSandboxedMode}
                            dataSource={selectedDataSource!}
                        />
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
                            opened by one of the <code>read_xxx()</code> operations.
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
                            doubleClickAction={canOpen ? this.handleShowOpenDatasetDialog : undefined}
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
        const canOpen = this.props.selectedDataSource;
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


export default connect(mapStateToProps, mapDispatchToProps)(DataSourcesPanel as any);
