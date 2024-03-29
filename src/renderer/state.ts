import { IconName } from '@blueprintjs/core';
import { Feature, FeatureCollection, GeoJsonObject, Point } from 'geojson';
import { JSONSchema7 } from 'json-schema';
import { KeycloakProfile } from 'keycloak-js';

import { SimpleStyle } from '../common/geojson-simple-style';
import { HostOS } from '../common/paths';
import { BaseMapOptions } from './components/cesium/cesium-util';
import { GeometryToolType } from './components/cesium/geometry-tool';
import { FileNode } from './components/desktop/fs/FileNode';
import {
    FileFilter,
    MessageBoxOptions,
    MessageBoxResult, OpenDialogOptions, OpenDialogProperty,
    OpenDialogResult,
    SaveDialogOptions, SaveDialogProperty,
    SaveDialogResult
} from './components/desktop/types';
import { PanelContainerLayout } from './components/PanelContainer';
import { ViewLayoutState, ViewState } from './components/ViewState';
import { JobFailure, JobProgress, JobStatus, WebAPIClient } from './webapi';


/**
 * Interface describing Cate's application state structure.
 * Cate's application state is a giant, structured, plain JavaScript object.
 *
 * It is modelled after the principles explained in http://jamesknelson.com/5-types-react-application-state/.
 *
 * @author Norman Fomferra
 */

export interface State {
    data: DataState;
    communication: CommunicationState;
    control: ControlState;
    session: SessionState;
    location: LocationState;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DataState

/**
 * Cate's domain data which is usually received from the Cate WebAPI service.
 */
export interface DataState {
    dataStores: DataStoreState[] | null;
    operations: OperationState[] | null;
    workspace: WorkspaceState | null;
    fsRootNode: FileNode;
    colorMaps: ColorMapCategoryState[] | null;
    baseMaps: BaseMapState[];
    workspaceNames: string[] | null;
    hasWebGL: boolean;
}

export type WebAPIProvision = 'standAlone' | 'hub';
export type WebAPIStatus = 'login' | 'launching' | 'connecting' | 'open' |
    'error' | 'closed' | 'shuttingDown' | 'loggingOut';

export interface WebAPIServiceInfo {
    name: string;
    version: string;
    timestamp: string;
    userRootMode: boolean;
    hostOS?: HostOS;
    dependencies?: {[packageName: string]: string};
    autoStopInfo?: WebAPIAutoStopInfo;
}

export interface WebAPIAutoStopInfo {
    // Configured auto-stop time in seconds
    availableTime: number;
    // Duration in seconds of service inactivity
    inactivityTime: number;
    // Duration in seconds remaining until service auto-stop
    remainingTime: number;
}

export interface HubStatus {
    status: "ok" | "offline";
    message?: string;
    deployment: "development" | "production";
}

export interface DataStoreNotice {
    id: string;
    title: string;
    content: string;
    icon: IconName | null;
    intent: string | null;
}

export interface DataStoreState {
    id: string;
    title: string | null;
    isLocal: boolean;
    description: string | null;
    notices: DataStoreNotice[] | null;
    dataSources?: DataSourceState[] | null;
}

export type DataSourceCapability =
    "open"
    | "write_zarr"
    | "constrain_time"
    | "constrain_region";


export interface DatasetDescriptor {
    data_id: string;
    data_type: string;
    crs?: string;
    bbox?: [number, number, number, number];
    spatial_res?: number;
    time_range?: [string | null, string | null];
    time_period?: string;
    data_vars?: VariableDescriptor[];
    coords?: VariableDescriptor[];
    abstract?: string;
    catalog_url?: string;
    catalogue_url?: string;
    cci_project?: string;
    info_url?: string;
    licences?: [string];
    title?: string;
    uuid?: string;
    // Anything else:
    // [attr_name: string]: any;
}

export interface VariableDescriptor {
    name: string;
    units?: string;
    long_name?: string;
    standard_name?: string;
    dims?: string[];
}

// TODO: (forman) use this in the future instead of DatasetDescriptor/VariableDescriptor
// {{{{{{{{{{{{

export interface DataDescriptor2 {
    data_id: string;
    data_type: string;
    crs?: string | null;
    bbox?: [number, number, number, number] | null;
    time_range?: [string | null, string | null] | null;
    time_period?: string | null;
    open_params_schema?: JSONSchema7 | null;
}

export interface GeoDataFrameDescriptor2 extends DataDescriptor2 {
}

export interface DatasetDescriptor2 extends DataDescriptor2 {
    spatial_res?: number | null;
    dims?: { [dim_name: string]: number } | null;
    coords?: { [var_name: string]: VariableDescriptor2 } | null;
    data_vars?: { [var_name: string]: VariableDescriptor2 } | null;
    attrs?: { [attr_name: string]: any } | null;
}

export interface VariableDescriptor2 {
    name: string;
    dtype: string;
    dims: string[];
    chunks?: number[] | null;
    attrs?: { [attr_name: string]: any } | null;
}

// }}}}}}}}}}}}


export interface DataSourceState {
    id: string;
    title?: string;
    // TODO: (forman) replace by descriptor in the future
    metaInfo?: DatasetDescriptor;
    metaInfoStatus: 'init' | 'loading' | 'ok' | 'error';
    // TODO: (forman) use this in the future instead of metaInfo
    // descriptor?: DatasetDescriptor2 | GeoDataFrameDescriptor2;
    // descriptorStatus: 'init' | 'loading' | 'ok' | 'error';
    dataType?: string | null;
    capabilities?: DataSourceCapability[] | null;
    temporalCoverage?: [string, string] | null;
}

export interface OperationState {
    name: string;
    qualifiedName: string;
    hasMonitor: boolean;
    description: string | null;
    tags: Array<string>;
    inputs: OperationInputState[];
    outputs: OperationOutputState[];
}

export interface OperationIOBaseState {
    name: string;
    dataType: string;
    description: string | null;
    units?: string | null;
}

export interface OperationInputState extends OperationIOBaseState {
    /* optional properties used mainly for validation */
    defaultValue?: any;
    nullable?: boolean;
    valueSet?: any[];
    valueSetSource?: string;
    valueRange?: [number, number] | [string, string];
    scriptLang?: string;
    fileOpenMode?: 'w' | 'r' | 'rw';
    fileFilters?: FileFilter[];
    fileProps?: OpenDialogProperty[] | SaveDialogProperty[];
    noUI?: boolean;
    password?: boolean;
}

export interface OperationOutputState extends OperationIOBaseState {
}

/**
 * An operation argument that refers to a constant value.
 */
export interface OperationArgumentValue {
    value: any;
}

/**
 * An operation argument that refers to another resource.
 */
export interface OperationArgumentSource {
    /**
     * Resource name. May later also use syntax "<resource>.<outputName>" or "<resource>[<variableName>]".
     */
    source: string;
}

/**
 * Operation argument.
 */
export type OperationArg = OperationArgumentValue | OperationArgumentSource;

/**
 * Positional operation argument list.
 */
//export type OperationArgs = OperationArg[];

/**
 * Non-positional operation keyword-arguments.
 */
export type OperationKWArgs = { [name: string]: OperationArg };

/**
 * IMPORTANT: WorkspaceState must reflect what is returned by cate.core.workspace.Workspace.to_json_dict()
 */
export interface WorkspaceState {
    /**
     * The workspace's base directory path.
     */
    baseDir: string;
    /**
     * The workspace's description.
     */
    description: string | null;
    /**
     * Is it a scratch workspace? Scratch workspaces must be saved-as to some real location.
     */
    isScratch: boolean;
    /**
     * Has it been modified since it has been created, opened, or saved?
     */
    isModified: boolean;
    /**
     * Has it been saved before?
     */
    isSaved: boolean;
    /**
     * The workflow and its steps.
     */
    workflow: WorkflowState;
    /**
     * Information about the resources
     */
    resources: ResourceState[];
}

/**
 * IMPORTANT: WorkflowState must reflect what is returned by cate.core.workflow.Workflow.to_json_dict()
 */
export interface WorkflowState {
    steps: WorkflowStepState[];
}

/**
 * IMPORTANT: WorkflowStepState must reflect what is returned by cate.core.workflow.Step.to_json_dict()
 */
export interface WorkflowStepState {
    /**
     * Step ID. The ID will be used as Workspace's resource name.
     */
    id: string;

    /**
     * Step type (not used yet).
     */
    type: 'operation' | 'workflow' | 'python-expression' | 'python-script' | 'executable';

    /**
     * The actual action to be performed. Allowed values depend on 'type'.
     * For example, 'op' is the operation's name, if type==="operation".
     */
    op: string;

    /**
     * Whether the step stores resource files for faster opening of workspaces.
     */
    persistent?: boolean;

    inputs: { [name: string]: WorkflowPortState & string };
    outputs: { [name: string]: WorkflowPortState & string };
}

/**
 * IMPORTANT: WorkflowStepState must reflect what is returned by cate.core.workflow.NodePort.to_json_dict()
 */
export interface WorkflowPortState {
    /**
     * A constant value.
     * Constraint: value!==undefined, if sourceRef===null.
     */
    value: any | undefined;
    /**
     * Reference to a step which provides the value of this port.
     * Constraint: sourceRef!==null, if value===undefined.
     *
     * Source reference can either be the ID of another (single-output) step or it can have the form
     * "stepId.outputPort" if it refers to specific output of a (multi-output) step.
     */
    source: string | null;
}

export type DimSizes = { [dimName: string]: number };
export type Attributes = { [attrName: string]: any };

// TODO (forman): harmonize ResourceState + VariableState, in the end
//                1. ResourceState is-a VariableState
//                2. ResourceState has-zero-or-more VariableStates
//                3. VariableState also has a path name

/**
 * IMPORTANT: ResourceState must reflect what is returned by cate.core.workspace.Workspace.to_json_dict()
 */
export interface ResourceState {
    id: number;
    updateCount: number;
    name: string;
    dataType: string;
    dimSizes?: DimSizes;
    units?: string;
    validMin?: number;
    validMax?: number;
    attributes?: Attributes;
    variables?: VariableState[];
    coordVariables?: VariableState[];
}

/**
 * IMPORTANT: VariableState must reflect what is returned by cate.core.workspace.Workspace.to_json_dict()
 */
export interface VariableState {
    name: string;
    dataType: string;
    numDims?: number;
    dimNames?: string[];
    shape?: number[];
    chunkSizes?: number[];
    units?: string;
    validMin?: number;
    validMax?: number;
    data?: any[];
    attributes?: Attributes;
    isCoord?: boolean;
    isDefault?: boolean;
    imageLayout?: ImageLayout;
    isFeatureAttribute?: boolean;
    isYFlipped?: boolean;
    colorMapName?: string;
    displayMin?: number;
    displayMax?: number;
    // Only given, if variable is scalar, see issue #702
    value?: number | string | boolean;
}

/**
 * Image layout for use with Cesium and OpenLayers.
 */
export interface ImageLayout {
    extent?: {
        /** The westernmost longitude, in radians, in the range [-Pi, Pi]. */
        west: number,
        /** The southernmost latitude, in radians, in the range [-Pi/2, Pi/2]. */
        south: number,
        /** The easternmost longitude, in radians, in the range [-Pi, Pi]. */
        east: number,
        /** The northernmost latitude, in radians, in the range [-Pi/2, Pi/2]. */
        north: number
    };
    ellipsoid?: {
        /** The radius in the x direction. */
        x: number;
        /** The radius in the y direction. */
        y: number;
        /** The radius in the z direction. */
        z: number;
    };
    numLevels: number;
    numLevelZeroTilesX: number;
    numLevelZeroTilesY: number;
    tileWidth: number;
    tileHeight: number;
}

export type WorldViewMode = '2D' | '3D';

/**
 * Data object for view type "world".
 */
export interface WorldViewDataState {
    /**
     * 2D map or 3D globe?
     */
    viewMode: WorldViewMode;

    /**
     * ID of the base map, see state.data.baseMaps.
     */
    baseMapId: string;

    /**
     * Code of the projection used by the 2D map.
     */
    projectionCode: string;

    /**
     * The layers in a viewer.
     */
    layers: LayerState[];

    /**
     * The ID of the selected layer.
     */
    selectedLayerId: string | null;

    /**
     * The ID of the selected entity in Cesium 3D globe.
     */
    selectedEntityId: string | null;

    /**
     * The position of a layer split. Must be in the range 0 to 1.
     */
    layerSplitPosition;
}

export interface FigureViewDataState {
    /**
     * The resource identifier.
     */
    resourceId: number;
    /**
     * Whether the figure has a fixed size or it adapts to the current container size.
     */
    fixedSize: boolean;
}

export interface AnimationViewDataState extends FigureViewDataState {
    /**
     * The HTML representing the animation.
     */
    innerHTML?: string;
    /**
     * The response status.
     */
    status?: number;
}


export interface TableViewDataState {
    resName: string;
    varName: string | null;
    dataRows: any[] | null;
    error?: any;
    isLoading?: boolean;
}


/**
 * State of a layer.
 */
export interface LayerState {
    /**
     * Layer ID.
     */
    id: string;

    /**
     * Layer type
     */
    type: 'VariableImage' | 'ResourceVector' | 'Image' | 'Vector' | 'Unknown';

    /**
     * Layer name.
     */
    name?: string | null;

    /**
     * True if the layer is visible and shown; otherwise, false.
     */
    visible: boolean;

    /**
     * The layer's opacity.
     */
    opacity?: number;
}

export interface ImageStatisticsState {
    /**
     * The true minimum value in the current data subset.
     */
    min: number;

    /**
     * The true maximum value in the current data subset.
     */
    max: number;
}

export const SPLIT_MODE_OFF = 'off';
export const SPLIT_MODE_LEFT = 'left';
export const SPLIT_MODE_RIGHT = 'right';
export type SplitMode = 'off' | 'left' | 'right';


/**
 * Base of image layers.
 */
export interface ImageLayerBase extends LayerState {
    /**
     * The brightness of this layer. 1.0 uses the unmodified imagery color.
     * Less than 1.0 makes the imagery darker while greater than 1.0 makes it brighter.
     */
    brightness: number;

    /**
     * The contrast of this layer. 1.0 uses the unmodified imagery color.
     * Less than 1.0 reduces the contrast while greater than 1.0 increases it.
     */
    contrast: number;

    /**
     * The hue of this layer. 0.0 uses the unmodified imagery color.
     */
    hue: number;

    /**
     * The saturation of this layer. 1.0 uses the unmodified imagery color.
     * Less than 1.0 reduces the saturation while greater than 1.0 increases it.
     */
    saturation: number;

    /**
     * The gamma correction to apply to this layer. 1.0 uses the unmodified imagery color.
     */
    gamma: number;

    /**
     * Split mode.
     */
    splitMode: SplitMode;
}

/**
 * State of an image layer.
 */
export interface ImageLayerState extends ImageLayerBase {
    /**
     * The layer type.
     */
    type: 'Image';
}

/**
 * Base of vector layers.
 */
export interface VectorLayerBase extends LayerState {
    /**
     * Stores the default style for all entities of the layer.
     */
    style?: SimpleStyle;

    /**
     * Stores the style and any edited entities.
     * This object will only contain keys, if an entities style has changed.
     * Default styles come from the SimpleStyle interface of VectorLayerBase.
     */
    entityStyles?: { [entityId: string]: SimpleStyle };
}


/**
 * State of a vector layer.
 */
export interface VectorLayerState extends VectorLayerBase {
    /**
     * The layer type.
     */
    type: 'Vector';

    /**
     * The (GeoJSON-providing) URL or GeoJSON object.
     */
    data: string | GeoJsonObject;
}

/**
 * Resource reference
 */
export interface ResourceRefState {
    /**
     * The id of the resource that contains the variable.
     */
    resId: number;
}

/**
 * Variable reference
 */
export interface VariableRefState extends ResourceRefState {
    /**
     * The name of the variable.
     */
    varName: string;
}

/**
 * Variable data reference
 */
export interface VariableDataRefState extends VariableRefState {
    /**
     * The current index into the variable that results in a 2D-subset (i.e. with dimensions ['lat', 'lon']).
     */
    varIndex: number[];
}

/**
 * State of an image layer that displays a variable.
 */
export interface VariableLayerBase extends LayerState, VariableDataRefState {
    /**
     * Image layer minimum display value.
     */
    displayMin: number;
    /**
     * Image layer maximum display value.
     */
    displayMax: number;
    /**
     * Image layer color map name.
     */
    colorMapName: string;
    /**
     * Whether to blend alpha 0...1 at bottom value range.
     */
    alphaBlending: boolean;
    /**
     * Image enhancement attributes.
     */
    statistics?: ImageStatisticsState;
}

/**
 * State of an image layer that displays a variable.
 */
export interface VariableImageLayerState extends ImageLayerBase, VariableLayerBase {
    /**
     * The layer type.
     */
    type: 'VariableImage';
}

/**
 * State of an image layer that displays a variable.
 */
export interface ResourceVectorLayerState extends VectorLayerBase, ResourceRefState {
    /**
     * The layer type.
     */
    type: 'ResourceVector';
}

/**
 * An object comprising the resource and one of its variables which can be represented as a spatial 2D layer.
 */
export class LayerVariableState {
    /**
     * The resource.
     */
    resource: ResourceState;
    /**
     * A spatial 2D variable within the resource.
     */
    variable: VariableState;
}

export interface BaseMapState {
    id: string;
    title: string;
    options: BaseMapOptions | null;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ColorMapState


export interface ColorMapState {
    name: string;
    imageData: string;
}

export interface ColorMapCategoryState {
    name: string;
    description: string;
    colorMaps: ColorMapState[];
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CommunicationState

/**
 * Communication state is the status of any not-yet-complete requests to other services.
 */
export interface CommunicationState {
    webAPIServiceURL: string;
    webAPIServiceInfo: WebAPIServiceInfo | null;
    webAPIStatus: WebAPIStatus | null;
    webAPIClient: WebAPIClient | null;
    userProfile: KeycloakProfile | null;
    hubStatus: HubStatus | null;
    // A map that stores the current state of any tasks (e.g. data fetch jobs from remote API) given a jobId
    tasks: { [jobId: number]: TaskState; };
}

export interface TaskState {
    title?: string;
    status: JobStatus;
    failure?: JobFailure;
    progress?: JobProgress;
    requestLock?: string;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ControlState


/**
 * Control State is state which is specific to a given container component, and which is not stored in the screen’s
 * URL or in the HTML5 History API.
 */
export interface ControlState {

    // TODO (forman): Move following selection properties into SessionState so they can be stored.
    // WorkspacePanel
    selectedWorkspaceResourceName: string | null;
    selectedWorkflowStepId: string | null;
    // VariablesPanel
    selectedVariableName: string | null;

    selectedCtxOperationName: string | null;

    // A map that stores the last state of any dialog given a dialogId
    dialogs: { [dialogId: string]: DialogState };

    // Select directory dialog
    directorySelectDialog: OpenDialogState;
    // Open file dialog
    fileOpenDialog: OpenDialogState;
    // Save file dialog
    fileSaveDialog: SaveDialogState;
    // Browse file dialog
    fileBrowseDialog: BrowseDialogState;
    // Message box
    messageBox: MessageBoxState;

    // Take care, workspace objects come from Python back-end, therefore must preserve view settings.
    viewLayout: ViewLayoutState;
    views: ViewState<any>[];
    activeViewId: string | null;

    newPlacemarkToolType: GeometryToolType;

    // Used to force component update after an entity's properties have changed
    entityUpdateCount: number;

    pwaInstallPromotionVisible: boolean;
    pwaDisplayMode: 'standalone' | 'browser';
}

export interface DialogState {
    isOpen?: boolean;
}

export interface OpenDialogState extends DialogState {
    onClose: (result: OpenDialogResult) => any;
    options?: OpenDialogOptions;
    result?: OpenDialogResult;
}

export interface SaveDialogState extends DialogState {
    onClose: (result: SaveDialogResult) => any;
    options?: SaveDialogOptions;
    result?: SaveDialogResult;
}

export interface BrowseDialogState extends DialogState {
    onClose: (result: OpenDialogResult) => any;
    options?: OpenDialogOptions;
}

export interface MessageBoxState extends DialogState {
    onClose?: (result: MessageBoxResult | null) => any;
    options?: MessageBoxOptions;
    result?: MessageBoxResult | null;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SessionState

export type SavedLayers = { [key: string]: LayerState };

/**
 * Backend-configuration settings.
 */
export interface BackendConfigState {
    dataStoresPath: string;
    useWorkspaceImageryCache: boolean;
    resourceNamePattern: string;
    proxyUrl: string;
}

export interface Placemark extends Feature<Point> {
    id: string;
}

export interface PlacemarkCollection extends FeatureCollection<Point> {
    features: Placemark[];
}

export const STYLE_CONTEXT_ENTITY = 'entity';
export const STYLE_CONTEXT_LAYER = 'layer';

export type StyleContext = 'entity' | 'layer';
export type WorkspacePanelMode = 'resources' | 'steps';

/**
 * Session state contains information about the human being which is currently using Cate.
 * Session state is only ever read when a component is mounted.
 * Session state can be used to save preferences.
 */
export interface SessionState {
    mainWindowBounds?: { x: number; y: number; width: number; height: number };
    devToolsOpened?: boolean;
    forceAppBar?: boolean;
    /**
     * lastWorkspacePath != null, only if it is not a scratch-workspace
     */
    lastWorkspacePath?: string | null;
    reopenLastWorkspace?: boolean;
    offlineMode: boolean;
    autoUpdateSoftware: boolean;
    autoShowNewFigures: boolean;

    // AppMainPage
    panelContainerUndockedMode: boolean;
    leftPanelContainerLayout: PanelContainerLayout;
    rightPanelContainerLayout: PanelContainerLayout;
    selectedLeftTopPanelId: string | null;
    selectedLeftBottomPanelId: string | null;
    selectedRightTopPanelId: string | null;
    selectedRightBottomPanelId: string | null;

    showLayerTextOverlay: boolean;
    debugWorldView: boolean;

    /**
     * backendConfig settings are applied on restart (of the WebAPI) only.
     */
    backendConfig: BackendConfigState;

    // DataSourcesPanel
    selectedDataStoreId: string | null;
    selectedDataSourceId: string | null;
    dataSourceFilterExpr: string;
    dataSourceListHeight: number;
    showDataSourceDetails: boolean;
    showAllDataSources: boolean;
    showDataSourceIDs: boolean;
    showDataStoreDescription: boolean;
    showDataStoreNotices: boolean;

    // OperationsPanel
    selectedOperationName: string | null;
    operationFilterTags: string[];
    operationFilterExpr: string;
    operationListHeight: number;
    showOperationDetails: boolean;

    // WorkspacePanel
    workspacePanelMode: WorkspacePanelMode;
    resourceListHeight: number;
    showResourceDetails: boolean;
    workflowStepListHeight: number;
    showWorkflowStepDetails: boolean;

    // VariablePanel
    variableListHeight: number;
    showVariableDetails: boolean;

    // LayersPanel
    showSelectedVariableLayer: boolean;
    layerListHeight: number;
    showLayerDetails: boolean;
    lastBaseMapId: string;
    savedLayers: SavedLayers;
    styleContext: StyleContext;

    // PlacemarksPanel
    placemarkCollection: PlacemarkCollection;
    selectedPlacemarkId: string | null;
    placemarkListHeight: number;
    showPlacemarkDetails: boolean;
    defaultPlacemarkStyle: SimpleStyle;

    // Preferences
    showDependencies?: boolean;

    // EU GDPR
    cookieConsentObtained: boolean;
    trackingConsentObtained: boolean;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LocationState

export class GeographicPosition {
    longitude: number;
    latitude: number;
    height?: number;
}

/**
 * Location state stores information about the current location in space and time.
 * Information in this object may change frequently, e.g. due to mouse moves on a Globe.
 */
export interface LocationState {
    globeMousePosition: GeographicPosition | null;
    globeViewPosition: GeographicPosition | null;
    positionData: { [varName: string]: number } | null
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MessageState

export interface MessageActionState {
    text: string;
    onClick?: (...actionArgs) => void;
    href?: string;
    icon?: IconName;
}

export interface MessageState {
    type: 'info' | 'success' | 'notification' | 'warning' | 'error';
    text: string | JSX.Element;
    action?: MessageActionState;
}

