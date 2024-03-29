import { createSelector, Selector } from 'reselect';
import * as Cesium from 'cesium';

import { requireElectron } from './electron';
import {
    canOpenDataSource,
    canCacheDataSource,
    canMapDataSource,
    canConstrainDataSourceRegion,
    canConstrainDataSourceTime,
    canConstrainDataSourceVariables,
    DEFAULT_BASE_MAP,
    DEFAULT_BASE_MAP_ID,
} from './state-util';
import {
    BaseMapState,
    ColorMapCategoryState,
    ColorMapState,
    DataSourceState,
    DataStoreState,
    DialogState,
    FigureViewDataState,
    GeographicPosition,
    ImageLayerState,
    LayerState,
    LayerVariableState,
    OperationState,
    Placemark,
    PlacemarkCollection,
    ResourceState,
    ResourceVectorLayerState,
    SavedLayers,
    State,
    STYLE_CONTEXT_ENTITY,
    STYLE_CONTEXT_LAYER,
    VariableImageLayerState,
    VariableLayerBase,
    VariableState,
    VectorLayerState, 
    WebAPIServiceInfo, 
    WebAPIStatus,
    WorkflowStepState,
    WorkspaceState,
    WorldViewDataState
} from './state';
import { JobStatusEnum, WebAPIClient } from './webapi';
import { BackendConfigAPI, ColorMapsAPI, DatasetAPI, OperationAPI, WorkspaceAPI, FileSystemAPI } from './webapi';
import { PanelContainerLayout } from './components/PanelContainer';
import {
    EXTERNAL_OBJECT_STORE,
    findOperation,
    getLockForGetWorkspaceVariableStatistics,
    getWorldViewSelectedEntity,
    getWorldViewSelectedGeometryWKTGetter,
    getWorldViewVectorLayerForEntity,
    getWorldViewViewer,
    isAnimationResource,
    isFigureResource,
    isSpatialImageVariable,
    isSpatialVectorVariable,
} from './state-util';
import { ViewLayoutState, ViewState } from './components/ViewState';
import { isNumber } from '../common/types';
import { GeometryWKTGetter } from './containers/editor/ValueEditor';
import { BaseMapOptions, entityToSimpleStyle } from './components/cesium/cesium-util';
import { SIMPLE_STYLE_DEFAULTS, SimpleStyle, simpleStyleFromFeatureProperties } from '../common/geojson-simple-style';
import { GeometryToolType } from './components/cesium/geometry-tool';
import { RemoteStorageAPI } from "./remoteStorageAPI";
import { FilesAPI } from "./webapi/apis/FilesApi";


const electron = requireElectron();

export const EMPTY_OBJECT = {};
export const EMPTY_ARRAY = [];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Application selectors

export const offlineModeSelector = (state: State): boolean => state.session.offlineMode;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Remote API selectors

export const webAPIServiceInfoSelector = (state: State): WebAPIServiceInfo | null => state.communication.webAPIServiceInfo;
export const webAPIStatusSelector = (state: State): WebAPIStatus | null => state.communication.webAPIStatus;
export const webAPIClientSelector = (state: State): WebAPIClient | null => state.communication.webAPIClient;
export const webAPIServiceURLSelector = (state: State): string => state.communication.webAPIServiceURL;

export const isLocalFSAccessAllowedSelector = (state: State): boolean => {
    // Note that once we have ChooseWorkspaceDialog and SelectWorkspaceDialog with directory choosers,
    // we can get rid of the electron requirement here.
    return !!electron
           && !!electron.ipcRenderer
           && !!state.communication.webAPIServiceInfo
           && !state.communication.webAPIServiceInfo.userRootMode;
};

export const webAPIRestUrlSelector = createSelector(
    webAPIServiceURLSelector,
    (webAPIServiceURL: string) => {
        return getRestUrl(webAPIServiceURL);
    }
);

export const apiWebSocketsUrlSelector = createSelector(
    webAPIServiceURLSelector,
    (webAPIServiceURL: string) => {
        return getAPIWebSocketsUrl(webAPIServiceURL);
    }
);

export const mplWebSocketUrlSelector = createSelector(
    webAPIServiceURLSelector,
    (webAPIServiceURL: string) => {
        return getMPLWebSocketsUrl(webAPIServiceURL);
    }
);

function getRestUrl(webAPIServiceURL: string): string {
    return makeURL(webAPIServiceURL, false, '/');
}

function getAPIWebSocketsUrl(webAPIServiceURL: string): string {
    return makeURL(webAPIServiceURL, true, 'api');
}

function getMPLWebSocketsUrl(webAPIServiceURL: string): string {
    return makeURL(webAPIServiceURL, true, 'mpl/figures/');
}

function makeURL(url: string, ws: boolean, path: string): string {
    // console.log(`>> makeUrl: [${url}] [${ws}] [${path}]`);
    const _url = new URL(url);
    const protocol = ws ? (_url.protocol === 'https:' ? 'wss:' : 'ws:') : _url.protocol;
    const pathname = _url.pathname;
    let newUrl = `${protocol}//${_url.host}`;
    if (pathname && pathname !== '/') {
        newUrl += pathname
    }
    if (path) {
        if (!(path.startsWith('/') || newUrl.endsWith('/'))) {
            newUrl += '/';
        }
        newUrl += path
    }
    // console.log(`<< makeUrl: [${newUrl}]`);
    return newUrl;
}

export const backendConfigAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new BackendConfigAPI(webAPIClient);
    }
);


export const datasetAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new DatasetAPI(webAPIClient);
    }
);

export const operationAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new OperationAPI(webAPIClient);
    }
);


export const workspaceAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new WorkspaceAPI(webAPIClient);
    }
);


export const remoteStorageAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new RemoteStorageAPI(webAPIClient);
    }
);


export const colorMapsAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new ColorMapsAPI(webAPIClient);
    }
);

export const fileSystemAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return webAPIClient !== null ? new FileSystemAPI(webAPIClient) : null;
    }
);

export const activeRequestLocksSelector = (state: State): Set<string> => {
    const activeRequestLocks = new Set<string>();
    for (let jobId in state.communication.tasks) {
        const task = state.communication.tasks[jobId];
        if (task.status === JobStatusEnum.NEW ||
            task.status === JobStatusEnum.SUBMITTED ||
            task.status === JobStatusEnum.IN_PROGRESS) {
            activeRequestLocks.add(task.requestLock);
        }
    }
    return activeRequestLocks;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Dialog state selectors

const DIALOG_STATE_SELECTORS: { [dialogId: string]: Selector<State, DialogState> } = {};

export const dialogStatesSelector = (state: State): { [dialogId: string]: DialogState } => state.control.dialogs;

export const dialogStateSelector = (dialogId: string) => {
    if (!DIALOG_STATE_SELECTORS[dialogId]) {
        DIALOG_STATE_SELECTORS[dialogId] = createSelector<State, DialogState, { [dialogId: string]: DialogState }>(
            dialogStatesSelector,
            (dialogStates: { [dialogId: string]: DialogState }) => dialogStates[dialogId] || EMPTY_OBJECT
        );
    }
    return DIALOG_STATE_SELECTORS[dialogId];
};

export const isDialogOpenSelector = createSelector(
    dialogStatesSelector,
    (dialogStates: { [dialogId: string]: DialogState }) => {
        return Object.getOwnPropertyNames(dialogStates).some(dialogId => dialogStates[dialogId].isOpen);
    }
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AppMainPage layout selectors

export const panelContainerUndockedModeSelector = (state: State): boolean => state.session.panelContainerUndockedMode;

export const leftPanelContainerLayoutSelector = (state: State): PanelContainerLayout => state.session.leftPanelContainerLayout;
export const rightPanelContainerLayoutSelector = (state: State): PanelContainerLayout => state.session.rightPanelContainerLayout;

export const selectedLeftTopPanelIdSelector = (state: State): string | null => state.session.selectedLeftTopPanelId;
export const selectedLeftBottomPanelIdSelector = (state: State): string
    | null => state.session.selectedLeftBottomPanelId;
export const selectedRightTopPanelIdSelector = (state: State): string | null => state.session.selectedRightTopPanelId;
export const selectedRightBottomPanelIdSelector = (state: State): string
    | null => state.session.selectedRightBottomPanelId;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Placemark selectors

export const newPlacemarkToolTypeSelector = (state: State): GeometryToolType => state.control.newPlacemarkToolType;
export const placemarkCollectionSelector = (state: State): PlacemarkCollection => state.session.placemarkCollection;
export const placemarksSelector = (state: State): Placemark[] => state.session.placemarkCollection.features;
export const selectedPlacemarkIdSelector = (state: State): string | null => state.session.selectedPlacemarkId;
export const showPlacemarkDetailsSelector = (state: State): boolean => state.session.showPlacemarkDetails;
export const defaultPlacemarkStyleSelector = (state: State): SimpleStyle => state.session.defaultPlacemarkStyle;

export const selectedPlacemarkSelector = createSelector<State,
    Placemark | null,
    Placemark[],
    string | null>(
    placemarksSelector,
    selectedPlacemarkIdSelector,
    (placemarks: Placemark[], selectedPlacemarkId: string | null) => {
        if (canFind(placemarks, selectedPlacemarkId)) {
            return placemarks.find(placemark => placemark.id === selectedPlacemarkId);
        }
        return null;
    }
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Location selectors

export const globeMousePositionSelector = (state: State): GeographicPosition | null => state.location.globeMousePosition;
export const globeViewPositionSelector = (state: State): GeographicPosition | null => state.location.globeViewPosition;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Operation selectors

export const operationsSelector = (state: State): OperationState[] | null => state.data.operations;
export const operationFilterTagsSelector = (state: State): string[] | null => state.session.operationFilterTags;
export const operationFilterExprSelector = (state: State): string | null => state.session.operationFilterExpr;
export const selectedOperationNameSelector = (state: State): string | null => state.session.selectedOperationName;
export const selectedCtxOperationNameSelector = (state: State): string | null => state.control.selectedCtxOperationName;

export const selectedOperationSelector = createSelector<State, OperationState | null, OperationState[] | null,
    string | null>(
    operationsSelector,
    selectedOperationNameSelector,
    (operations, selectedOperationName) => {
        if (operations && operations.length && selectedOperationName) {
            return operations.find(op => op.name === selectedOperationName);
        }
        return null;
    }
);

export const selectedCtxOperationSelector = createSelector<State, OperationState | null, OperationState[] | null,
    string | null>(
    operationsSelector,
    selectedCtxOperationNameSelector,
    (operations, selectedOperationName) => {
        if (operations && operations.length && selectedOperationName) {
            return operations.find(op => op.name === selectedOperationName);
        }
        return null;
    }
);

export const filteredOperationsSelector = createSelector<State, OperationState[], OperationState[] | null,
    string[]
    | null, string | null>(
    operationsSelector,
    operationFilterTagsSelector,
    operationFilterExprSelector,
    (operations, operationFilterTags, operationFilterExpr) => {
        const hasOperations = operations && operations.length;
        const hasFilterExpr = operationFilterExpr && operationFilterExpr !== '';
        const hasFilterTags = operationFilterTags && operationFilterTags.length;
        if (hasOperations && (hasFilterExpr || hasFilterTags)) {
            let nameMatches;
            if (hasFilterExpr) {
                const filterExprLC = operationFilterExpr.toLowerCase();
                const parts = filterExprLC.split(' ');
                nameMatches = op => {
                    return parts.every(part => op.name.toLowerCase().includes(part));
                };
            } else {
                // noinspection JSUnusedLocalSymbols
                nameMatches = op => true;
            }
            let hasTag;
            if (hasFilterTags) {
                hasTag = op => !operationFilterTags.length || operationFilterTags.every(tag => new Set(op.tags).has(tag));
            } else {
                // noinspection JSUnusedLocalSymbols
                hasTag = op => true;
            }
            return operations.filter(op => nameMatches(op) && hasTag(op));
        }
        return operations || EMPTY_ARRAY;
    }
);

export const operationsTagCountsSelector = createSelector<State, Map<string, number>, OperationState[] | null>(
    operationsSelector,
    (operations) => {
        let tagCounts = new Map<string, number>();
        (operations || EMPTY_ARRAY).forEach((op: OperationState) => (op.tags || EMPTY_ARRAY).forEach((tag: string) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }));
        return tagCounts;
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Data store and data source selectors

export const dataStoresSelector = (state: State) => state.data.dataStores;
export const selectedDataStoreIdSelector = (state: State) => state.session.selectedDataStoreId;
export const selectedDataSourceIdSelector = (state: State) => state.session.selectedDataSourceId;
export const dataSourceFilterExprSelector = (state: State) => state.session.dataSourceFilterExpr;
export const dataSourceListHeightSelector = (state: State) => state.session.dataSourceListHeight;
export const showDataSourceDetailsSelector = (state: State) => state.session.showDataSourceDetails;
export const showAllDataSourcesSelector = (state: State): boolean => state.session.showAllDataSources;
export const showDataSourceIDsSelector = (state: State): boolean => state.session.showDataSourceIDs;
export const showDataStoreDescriptionSelector = (state: State): boolean => state.session.showDataStoreDescription;
export const showDataStoreNoticesSelector = (state: State): boolean => state.session.showDataStoreNotices;

export const selectedDataStoreSelector = createSelector<State, DataStoreState | null,
    DataStoreState[] | null,
    string | null>(
    dataStoresSelector,
    selectedDataStoreIdSelector,
    (dataStores, selectedDataStoreId) => {
        if (canFind(dataStores, selectedDataStoreId)) {
            return dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
        }
        return null;
    }
);

export const selectedDataSourcesSelector = createSelector<State, DataSourceState[] | null,
    DataStoreState | null>(
    selectedDataStoreSelector,
    (selectedDataStore) => {
        return (selectedDataStore && selectedDataStore.dataSources) || null;
    }
);

export const filteredDataSourcesSelector = createSelector<State, DataSourceState[] | null,
    DataSourceState[] | null,
    string | null,
    boolean>(
    selectedDataSourcesSelector,
    dataSourceFilterExprSelector,
    showAllDataSourcesSelector,
    (selectedDataSources, dataSourceFilterExpr, showAllDataSources) => {
        const hasDataSources = selectedDataSources && selectedDataSources.length;
        const hasFilterExpr = dataSourceFilterExpr && dataSourceFilterExpr !== '';
        if (hasDataSources && (hasFilterExpr || !showAllDataSources)) {
            const dataSourceFilterExprLC = dataSourceFilterExpr.toLowerCase();
            const parts = dataSourceFilterExprLC.split(' ');
            return selectedDataSources.filter(ds => matchesIdOrTitle(ds, showAllDataSources, parts));
        }
        return selectedDataSources;
    }
);

function matchesIdOrTitle(ds: DataSourceState, showAllDataSources: boolean, searchWords: string[]) {
    let isCandidate = showAllDataSources || canOpenDataSource(ds);
    if (!isCandidate) {
        return false;
    }
    const id = ds.id.toLowerCase();
    if (searchWords.every(word => id.includes(word))) {
        return true;
    }
    let title = ds.title || (ds.metaInfo ? ds.metaInfo.title : null);
    if (!title || title === '') {
        return false;
    }
    title = title.toLowerCase();
    return searchWords.every(word => title.includes(word));
}

export const selectedDataSourceSelector = createSelector<State, DataSourceState | null, DataSourceState[] | null,
    string
    | null>(
    selectedDataSourcesSelector,
    selectedDataSourceIdSelector,
    (selectedDataSources, selectedDataSourceId) => {
        if (canFind(selectedDataSources, selectedDataSourceId)) {
            return selectedDataSources.find(dataSource => dataSource.id === selectedDataSourceId);
        }
        return null;
    }
);

export const selectedDataSourceTemporalCoverageSelector = createSelector<State,
    [string | null, string | null] | null,
    DataSourceState
    | null>(
    selectedDataSourceSelector,
    (selectedDataSource: DataSourceState): [string | null, string | null] | null => {
        return (selectedDataSource
                && selectedDataSource.metaInfo
                && selectedDataSource.metaInfo.time_range) || null;
    }
);

export const canCacheDataSourceSelector = createSelector<State, boolean, string | null, DataSourceState | null>(
    selectedDataStoreIdSelector,
    selectedDataSourceSelector,
    (selectedDataStoreId, selectedDataSource): boolean => {
        if (selectedDataStoreId === null
            || selectedDataStoreId === 'local'
            || selectedDataStoreId === 'cci-zarr-store') {
            return false;
        }
        return selectedDataSource ? canCacheDataSource(selectedDataSource) : false;
    }
);

export const canMapDataSourceSelector = createSelector<State, boolean, DataSourceState | null>(
    selectedDataSourceSelector,
    (selectedDataSource: DataSourceState | null): boolean => {
        return selectedDataSource ? canMapDataSource(selectedDataSource) : false;
    }
);

export const canConstrainDataSourceTimeSelector = createSelector<State, boolean, DataSourceState | null>(
    selectedDataSourceSelector,
    (selectedDataSource: DataSourceState | null): boolean => {
        return selectedDataSource && canConstrainDataSourceTime(selectedDataSource);
    }
);

export const canConstrainDataSourceRegionSelector = createSelector<State, boolean, DataSourceState | null>(
    selectedDataSourceSelector,
    (selectedDataSource: DataSourceState | null): boolean => {
        return selectedDataSource && canConstrainDataSourceRegion(selectedDataSource);
    }
);

export const canConstrainDataSourceVariablesSelector = createSelector<State, boolean, DataSourceState | null>(
    selectedDataSourceSelector,
    (selectedDataSource: DataSourceState | null): boolean => {
        return selectedDataSource && canConstrainDataSourceVariables(selectedDataSource);
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Workspace, resource, step, and variable selectors

export const workspaceSelector = (state: State): WorkspaceState | null => {
    return state.data.workspace;
};
export const isScratchWorkspaceSelector = (state: State): boolean => {
    return state.data.workspace && state.data.workspace.isScratch;
};
export const workspaceBaseDirSelector = (state: State): string | null => {
    return state.data.workspace && state.data.workspace.baseDir;
};
export const resourcesSelector = (state: State): ResourceState[] => {
    return state.data.workspace ? state.data.workspace.resources : EMPTY_ARRAY;
};
export const workflowStepsSelector = (state: State): WorkflowStepState[] => {
    return state.data.workspace ? state.data.workspace.workflow.steps : EMPTY_ARRAY;
};
export const lastWorkspacePathSelector = (state: State): string | null => {
    return state.session.lastWorkspacePath;
};
export const resourceListHeightSelector = (state: State): number => {
    return state.session.resourceListHeight;
};
export const showResourceDetailsSelector = (state: State): boolean => {
    return state.session.showResourceDetails;
};
export const selectedResourceNameSelector = (state: State): string | null => {
    return state.control.selectedWorkspaceResourceName;
};
export const workflowStepListHeightSelector = (state: State): number => {
    return state.session.workflowStepListHeight;
};
export const showWorkflowStepDetailsSelector = (state: State): boolean => {
    return state.session.showWorkflowStepDetails;
};
export const selectedWorkflowStepIdSelector = (state: State): string | null => {
    return state.control.selectedWorkflowStepId || selectedResourceNameSelector(state);
};
export const selectedVariableNameSelector = (state: State): string | null => {
    return state.control.selectedVariableName;
};

export const workspaceNameSelector = createSelector<State, string | null, string | null>(
    workspaceBaseDirSelector,
    (baseDir: string | null) => {
        return getFileName(baseDir);
    }
);

export const workspaceDirSelector = createSelector<State, string | null, string | null>(
    workspaceBaseDirSelector,
    (baseDir: string | null) => {
        return getParentDir(baseDir);
    }
);

export const lastWorkspaceDirSelector = createSelector<State, string | null, string | null>(
    lastWorkspacePathSelector,
    (baseDir: string | null) => {
        return getParentDir(baseDir);
    }
);

function getFileName(path: string | null): string | null {
    if (!path) {
        return null;
    }
    let index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return index >= 0 ? path.substring(index + 1) : path;
}

function getParentDir(path: string | null): string | null {
    if (!path) {
        return null;
    }
    let index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return index >= 0 ? path.substring(0, index) : '';
}

export const resourceNamesSelector = createSelector<State, string[], ResourceState[]>(
    resourcesSelector,
    (resources: ResourceState[]) => {
        return resources.map(r => r.name)
    }
);

export const resourceMapSelector = createSelector<State, { [name: string]: ResourceState }, ResourceState[]>(
    resourcesSelector,
    (resources: ResourceState[]) => {
        const resourceMap = {};
        resources.forEach((resource => {
            resourceMap[resource.name] = resource;
        }));
        return resourceMap;
    }
);

export const selectedResourceSelector = createSelector<State, ResourceState | null, ResourceState[], string>(
    resourcesSelector,
    selectedResourceNameSelector,
    (resources: ResourceState[], selectedResourceName: string) => {
        if (canFind(resources, selectedResourceName)) {
            return resources.find(r => r.name === selectedResourceName);
        }
        return null;
    }
);

export const selectedResourceAttributesSelector = createSelector<State, string[][], ResourceState | null>(
    selectedResourceSelector,
    (selectedResource: ResourceState | null) => {
        if (!selectedResource || !selectedResource.attributes) {
            return EMPTY_ARRAY;
        }
        const array = [];
        const attributes = selectedResource.attributes;
        for (let attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                array.push([attrName, attributes[attrName]])
            }
        }
        return array;
    }
);

export const selectedWorkflowStepResourceSelector = createSelector<State, ResourceState | null, ResourceState[], string>(
    resourcesSelector,
    selectedWorkflowStepIdSelector,
    (resources: ResourceState[], selectedWorkflowStepId: string) => {
        if (canFind(resources, selectedWorkflowStepId)) {
            return resources.find(r => r.name === selectedWorkflowStepId);
        }
        return null;
    }
);

export const selectedWorkflowStepSelector = createSelector<State,
    WorkflowStepState | null,
    WorkflowStepState[],
    string>(
    workflowStepsSelector,
    selectedWorkflowStepIdSelector,
    (workflowSteps: WorkflowStepState[], selectedWorkflowStepId: string) => {
        if (canFind(workflowSteps, selectedWorkflowStepId)) {
            return workflowSteps.find(r => r.id === selectedWorkflowStepId);
        }
        return null;
    }
);

export const selectedResourceWorkflowStepSelector = createSelector<State,
    WorkflowStepState | null,
    WorkflowStepState[],
    string>(
    workflowStepsSelector,
    selectedResourceNameSelector,
    (workflowSteps: WorkflowStepState[], selectedResourceName: string) => {
        if (canFind(workflowSteps, selectedResourceName)) {
            return workflowSteps.find(r => r.id === selectedResourceName);
        }
        return null;
    }
);

export const selectedWorkflowStepOpSelector = createSelector<State, OperationState | null, OperationState[] | null,
    WorkflowStepState
    | null>(
    operationsSelector,
    selectedWorkflowStepSelector,
    (operations: OperationState[] | null, selectedWorkflowStep: WorkflowStepState | null) => {
        if (operations && selectedWorkflowStep && selectedWorkflowStep.op) {
            return findOperation(operations, selectedWorkflowStep.op);
        }
        return null;
    }
);

export const figureResourcesSelector = createSelector<State, ResourceState[], ResourceState[]>(
    resourcesSelector,
    (resources: ResourceState[]) => {
        return resources.filter(r => isFigureResource(r))
    }
);

export const selectedFigureResourceSelector = createSelector<State, ResourceState | null, ResourceState | null>(
    selectedResourceSelector,
    (resource: ResourceState | null) => {
        return resource && isFigureResource(resource) ? resource : null;
    }
);

export const animationResourcesSelector = createSelector<State, ResourceState[], ResourceState[]>(
    resourcesSelector,
    (resources: ResourceState[]) => {
        return resources.filter(r => isAnimationResource(r))
    }
);

export const variablesSelector = createSelector<State, VariableState[] | null, ResourceState | null>(
    selectedResourceSelector,
    (selectedResource: ResourceState | null) => {
        return selectedResource ? (selectedResource.variables || null) : null;
    }
);


export const selectedVariableSelector = createSelector<State, VariableState | null, VariableState[] | null,
    string
    | null>(
    variablesSelector,
    selectedVariableNameSelector,
    (selectedVariables: VariableState[] | null, selectedVariableName: string | null) => {
        if (canFind(selectedVariables, selectedVariableName)) {
            return (selectedVariables || EMPTY_ARRAY).find(v => v.name === selectedVariableName);
        }
        return null;
    }
);

export const selectedVariableAttributesTableDataSelector = createSelector<State, [string, any][] | null, VariableState | null>(
    selectedVariableSelector,
    (selectedVariable: VariableState | null) => {
        if (!selectedVariable) {
            return null;
        }
        const tableData: [string, any][] = [
            ['Data type', selectedVariable.dataType],
            ['Units', selectedVariable.units || ''],
            ['Valid minimum', selectedVariable.validMin],
            ['Valid maximum', selectedVariable.validMax],
            ['Dimension names', selectedVariable.dimNames && selectedVariable.dimNames.join(', ')],
            ['Array shape', selectedVariable.shape && selectedVariable.shape.join(', ')],
            ['Chunk sizes', selectedVariable.chunkSizes && selectedVariable.chunkSizes.join(', ')],
            [' ', ''],
        ];
        let attributes = selectedVariable.attributes;
        if (attributes) {
            Object.getOwnPropertyNames(attributes).forEach(name => {
                tableData.push([name, attributes[name]]);
            });
        }
        return tableData;
    }
);


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// View selectors

export const viewLayoutSelector = (state: State): ViewLayoutState => state.control.viewLayout;
export const viewsSelector = (state: State): ViewState<any>[] => state.control.views;
export const activeViewIdSelector = (state: State): string | null => state.control.activeViewId;

export const figureViewsSelector = createSelector<State, ViewState<FigureViewDataState>[], ViewState<any>[]>(
    viewsSelector,
    (views: ViewState<any>[]) => {
        return (views ? views.filter(view => view.type === 'figure') : EMPTY_ARRAY) as ViewState<FigureViewDataState>[];
    }
);

export const activeViewSelector = createSelector<State, ViewState<any> | null, ViewState<any>[], string | null>(
    viewsSelector,
    activeViewIdSelector,
    (views: ViewState<any>[], activeViewId) => {
        if (canFind(views, activeViewId)) {
            return views.find(view => view.id === activeViewId);
        }
        return null;
    }
);

export const activeViewTypeSelector = createSelector<State, string | null, ViewState<any> | null>(
    activeViewSelector,
    (view: ViewState<any>) => {
        return view ? view.type : null
    }
);

export const selectedEntityIdSelector = createSelector<State, string | null, ViewState<any> | null>(
    activeViewSelector,
    (view: ViewState<any>) => {
        if (view && view.type === 'world') {
            const data = view.data as WorldViewDataState;
            return data.selectedEntityId;
        }
        return null;
    }
);

// noinspection JSUnusedLocalSymbols
export const selectedEntitySelector = createSelector<State, Cesium.Entity | null, ViewState<any> | null, any>(
    activeViewSelector,
    selectedEntityIdSelector, // we need this to invalidate selector on selection changes in Cesium
    (view: ViewState<any>, unusedEntityId: any) => {
        return getWorldViewSelectedEntity(view);
    }
);

export const selectedWorldViewViewerSelector = createSelector<State, Cesium.Viewer | null, ViewState<any> | null>(
    activeViewSelector,
    (view: ViewState<any>) => {
        return view ? getWorldViewViewer(view) : null;
    }
);

export const selectedGeometryWKTGetterSelector = createSelector<State, GeometryWKTGetter, ViewState<any> | null>(
    activeViewSelector,
    getWorldViewSelectedGeometryWKTGetter
);

// noinspection JSUnusedLocalSymbols
export const externalObjectStoreSelector = (state: State) => EXTERNAL_OBJECT_STORE;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Layer selectors

export const savedLayersSelector = (state: State): SavedLayers => state.session.savedLayers;

export const selectedLayerIdSelector = createSelector<State, string | null, ViewState<any> | null>(
    activeViewSelector,
    (view: ViewState<any> | null) => {
        return (view && view.data.selectedLayerId) || null;
    }
);

export const baseMapsSelector = (state: State) => state.data.baseMaps;

export const baseMapIdSelector = createSelector<State, string, BaseMapState[], ViewState<any> | null>(
    baseMapsSelector,
    activeViewSelector,
    (baseMaps: BaseMapState[], view: ViewState<any> | null) => {
        return (view
                && view.data.baseMapId) || DEFAULT_BASE_MAP_ID;
    }
);

export const baseMapSelector = createSelector<State, BaseMapState, BaseMapState[], ViewState<any> | null>(
    baseMapsSelector,
    activeViewSelector,
    (baseMaps: BaseMapState[], view: ViewState<any> | null) => {
        return (view
                && view.data.baseMapId
                && baseMaps.find(bm => bm.id === view.data.baseMapId)) || DEFAULT_BASE_MAP;
    }
);

export const baseMapOptionsSelector = createSelector<State, BaseMapOptions | null, BaseMapState>(
    baseMapSelector,
    (baseMap: BaseMapState) => {
        return baseMap.options;
    }
);

export const layersSelector = createSelector<State, LayerState[] | null, ViewState<any> | null>(
    activeViewSelector,
    (view: ViewState<any> | null) => {
        return (view && view.data.layers) || null;
    }
);

export const selectedLayerSelector = createSelector<State, LayerState | null, LayerState[], string | null>(
    layersSelector,
    selectedLayerIdSelector,
    (layers: LayerState[] | null, selectedLayerId: string | null): LayerState | null => {
        if (canFind(layers, selectedLayerId)) {
            return layers.find(l => l.id === selectedLayerId);
        }
        return null;
    }
);

export const selectedLayerIndexSelector = createSelector<State, number, LayerState[], string>(
    layersSelector,
    selectedLayerIdSelector,
    (layers: LayerState[] | null, selectedLayerId: string | null): number => {
        if (canFind(layers, selectedLayerId)) {
            return layers.findIndex(l => l.id === selectedLayerId);
        }
        return -1;
    }
);

export const selectedImageLayerSelector = createSelector<State, ImageLayerState | null, LayerState | null>(
    selectedLayerSelector,
    (selectedLayer: LayerState | null) => {
        if (selectedLayer && (selectedLayer.type === 'Image' || selectedLayer.type === 'VariableImage')) {
            return selectedLayer as ImageLayerState;
        }
        return null;
    }
);

export const selectedVariableImageLayerSelector = createSelector<State, VariableImageLayerState | null,
    LayerState | null>(
    selectedLayerSelector,
    (selectedLayer: LayerState | null) => {
        if (selectedLayer && selectedLayer.type === 'VariableImage') {
            return selectedLayer as VariableImageLayerState;
        }
        return null;
    }
);

export const selectedVariableImageLayerDisplayMinMaxSelector = createSelector<State,
    [number, number] | null, VariableImageLayerState | null>(
    selectedVariableImageLayerSelector,
    (selectedLayer: VariableImageLayerState | null) => {
        if (selectedLayer) {
            const displayMin = isNumber(selectedLayer.displayMin) ? selectedLayer.displayMin : 0;
            const displayMax = isNumber(selectedLayer.displayMax) ? selectedLayer.displayMax : displayMin + 1;
            return [displayMin, displayMax];
        }
        return null;
    }
);

export const selectedVectorLayerSelector = createSelector<State, VectorLayerState | null,
    LayerState | null>(
    selectedLayerSelector,
    (selectedLayer: LayerState | null) => {
        if (selectedLayer && (selectedLayer.type === 'Vector' || selectedLayer.type === 'ResourceVector')) {
            return selectedLayer as VectorLayerState;
        }
        return null;
    }
);

export const entityUpdateCountSelector = (state: State) => state.control.entityUpdateCount;

export const styleContextSelector = (state: State) => state.session.styleContext;

// noinspection JSUnusedLocalSymbols
export const vectorStyleSelector = createSelector<State, SimpleStyle, ViewState<any>, string, VectorLayerState | null, Placemark | null, Cesium.Entity | null, number>(
    activeViewSelector,
    styleContextSelector,
    selectedVectorLayerSelector,
    selectedPlacemarkSelector,
    selectedEntitySelector,
    entityUpdateCountSelector,
    (view: ViewState<any>, styleContext, selectedVectorLayer, selectedPlacemark, selectedEntity, entityUpdateCount) => {
        const selectedLayerStyle = selectedVectorLayer && selectedVectorLayer.style;
        let style;
        if (styleContext === STYLE_CONTEXT_LAYER) {
            style = selectedLayerStyle;
        } else if (styleContext === STYLE_CONTEXT_ENTITY) {
            if (selectedPlacemark) {
                const placemarkStyle = simpleStyleFromFeatureProperties(selectedPlacemark.properties);
                style = {...selectedLayerStyle, ...placemarkStyle};
            } else if (selectedEntity) {
                const entityStyle = entityToSimpleStyle(selectedEntity);
                const entityVectorLayer = getWorldViewVectorLayerForEntity(view, selectedEntity);
                const entityVectorLayerStyle = entityVectorLayer && entityVectorLayer.style;
                const savedEntityStyle = entityVectorLayer
                                         && entityVectorLayer.entityStyles
                                         && entityVectorLayer.entityStyles[selectedEntity.id];
                style = {...selectedLayerStyle, ...entityVectorLayerStyle, ...entityStyle, ...savedEntityStyle};
            }
        }
        return {...SIMPLE_STYLE_DEFAULTS, ...style};
    }
);

export const selectedResourceVectorLayerSelector = createSelector<State, ResourceVectorLayerState | null,
    LayerState | null>(
    selectedLayerSelector,
    (selectedLayer: LayerState | null) => {
        if (selectedLayer && selectedLayer.type === 'ResourceVector') {
            return selectedLayer as ResourceVectorLayerState;
        }
        return null;
    }
);

export const selectedLayerVariablesSelector = createSelector<State, LayerVariableState[] | null, ResourceState[]>(
    resourcesSelector,
    (resources: ResourceState[]) => {
        const layerVariables = [];
        for (let resource of resources) {
            if (resource.variables) {
                for (let variable of resource.variables) {
                    if (isSpatialImageVariable(variable) || isSpatialVectorVariable(variable)) {
                        layerVariables.push({resource, variable});
                    }
                }
            }
        }
        return layerVariables;
    }
);

export const isComputingVariableStatistics = createSelector<State, boolean,
    ResourceState | null, VariableState | null, VariableLayerBase | null, Set<string>>(
    selectedResourceSelector,
    selectedVariableSelector,
    selectedVariableImageLayerSelector,
    activeRequestLocksSelector,
    (selectedResource: ResourceState | null,
     selectedVariable: VariableState | null,
     selectedVariableImageLayer: VariableLayerBase | null,
     activeRequestLocks: Set<string>) => {
        const imageLayer = selectedVariableImageLayer;
        if (!selectedResource || !selectedVariable || !imageLayer) {
            return false;
        }
        const requestLock = getLockForGetWorkspaceVariableStatistics(selectedResource.name,
                                                                     selectedVariable.name,
                                                                     imageLayer.varIndex);
        return activeRequestLocks.has(requestLock);
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Color map selectors

export const colorMapCategoriesSelector = (state: State): Array<ColorMapCategoryState> => state.data.colorMaps;

export const selectedColorMapSelector = createSelector<State, ColorMapState, ColorMapCategoryState[] | null,
    VariableImageLayerState
    | null>(
    colorMapCategoriesSelector,
    selectedVariableImageLayerSelector,
    (colorMapCategories: ColorMapCategoryState[] | null, selectedImageLayer: VariableImageLayerState | null) => {
        const selectedColorMapName = selectedImageLayer ? selectedImageLayer.colorMapName : null;
        if (canFind(colorMapCategories, selectedColorMapName)) {
            for (let cat of colorMapCategories) {
                const selectedColorMap = cat.colorMaps.find(cm => cm.name === selectedColorMapName);
                if (selectedColorMap) {
                    return selectedColorMap;
                }
            }
        }
        return null;
    }
);

export const fileAPISelector = createSelector(
    webAPIClientSelector,
    (webAPIClient) => {
        return new FilesAPI(webAPIClient);
    }
);


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utilities

function canFind(array: any[], id: string): boolean {
    return array && array.length && !!id;
}


