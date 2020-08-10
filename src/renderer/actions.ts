import * as redux from 'redux';
import * as d3 from 'd3-fetch';
import * as Cesium from 'cesium';
import { DirectGeometryObject } from 'geojson';
import copyToClipboard from 'copy-to-clipboard';
import { FileNode, getFileNode, sanitizePath } from './components/desktop/fs/FileNode';

import {
    BackendConfigState,
    ColorMapCategoryState, ControlState,
    DataSourceState,
    DataStoreState,
    GeographicPosition,
    ImageStatisticsState,
    LayerState,
    MessageState,
    OperationKWArgs,
    OperationState,
    Placemark,
    ResourceState,
    SavedLayers, SessionState,
    SplitMode,
    State, StyleContext,
    TaskState,
    VariableLayerBase,
    VariableState,
    WebAPIProvision,
    WebAPIServiceInfo,
    WebAPIStatus,
    WorkspaceState,
    WorldViewMode
} from './state';
import { ViewPath, ViewState } from './components/ViewState';
import {
    ERROR_CODE_CANCELLED,
    ERROR_CODE_INVALID_PARAMS,
    JobFailure,
    JobProgress,
    JobProgressHandler,
    JobPromise,
    JobStatusEnum,
    newWebAPIClient,
    WebAPIClient
} from './webapi';
import * as selectors from './selectors';
import * as assert from '../common/assert';
import { PanelContainerLayout } from './components/PanelContainer';
import { DEFAULT_SERVICE_URL } from './initial-state';
import {
    AUTO_LAYER_ID,
    findResourceByName,
    genSimpleId,
    getCsvUrl,
    getFeatureUrl,
    getHtmlUrl,
    getLockForGetWorkspaceVariableStatistics,
    getLockForLoadDataSources,
    getNonSpatialIndexers,
    getWorldViewVectorLayerForEntity,
    isAnimationResource,
    isFigureResource,
    MY_PLACES_LAYER_ID,
    newVariableLayer,
    PLACEMARK_ID_PREFIX
} from './state-util';
import { SplitDir } from './components/Splitter';
import { updateObject } from '../common/objutil';
import { showToast } from './toast';
import { isDefined, isNumber } from '../common/types';
import { reloadEntityWithOriginalGeometry } from './containers/globe-view-layers';
import { SimpleStyle } from '../common/geojson-simple-style';
import { GeometryToolType } from './components/cesium/geometry-tool';
import { getEntityByEntityId } from './components/cesium/cesium-util';
import { isAssignableFrom, VAR_NAME_LIKE_TYPE, VAR_NAMES_LIKE_TYPE } from '../common/cate-types';
import {
    assignConstantValueInput,
    assignResourceNameInput,
    InputAssignments,
    isInputAssigned
} from './containers/editor/value-editor-assign';
import { DELETE_WORKSPACE_DIALOG_ID, OPEN_WORKSPACE_DIALOG_ID } from './containers/ChooseWorkspaceDialog';
import { AuthAPI, AuthInfo, User } from './webapi/apis/AuthAPI'
import { ServiceInfoAPI } from './webapi/apis/ServiceInfoAPI';
import { HttpError } from './webapi/HttpError';
import { requireElectron } from './electron';
import {
    MessageBoxOptions,
    MessageBoxResult,
    OpenDialogOptions, OpenDialogResult,
    SaveDialogOptions,
    SaveDialogResult
} from './components/desktop/types';

import desktopActions from './components/desktop/actions';

const electron = requireElectron();

/**
 * The fundamental Action type as it is used here.
 * All actions must have a "type" and a "payload" property.
 * Basic structure (i.e. the "type" property) is prescribed by "redux" module.
 */
export interface Action extends redux.Action {
    type: string;
    payload?: any;
}

/**
 * Signature of the Action dispatcher as used here.
 * Basic call interface is prescribed by "redux" module.
 */
export type Dispatch = (action: Action | ThunkAction) => void;

/**
 * Signature of a function that returns the current application state object.
 * Call interface is prescribed by "redux" module.
 */
export type GetState = () => State;

/**
 * Signature of a "thunk" action function as used here.
 * A thunk is piece of code that is executed later.
 * Basic call interface is prescribed by "redux-thunk" module.
 */
export type ThunkAction = (dispatch: Dispatch, getState: GetState) => void;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Application-level actions

export const UPDATE_INITIAL_STATE = 'UPDATE_INITIAL_STATE';
export const SET_WEBAPI_PROVISION = 'SET_WEBAPI_PROVISION';
export const SET_WEBAPI_STATUS = 'SET_WEBAPI_STATUS';
export const SET_WEBAPI_SERVICE_URL = 'SET_WEBAPI_SERVICE_URL';
export const SET_WEBAPI_SERVICE_CUSTOM_URL = 'SET_WEBAPI_SERVICE_CUSTOM_URL';
export const SET_WEBAPI_SERVICE_INFO = 'SET_WEBAPI_SERVICE_INFO';
export const UPDATE_DIALOG_STATE = 'UPDATE_DIALOG_STATE';
export const UPDATE_TASK_STATE = 'UPDATE_TASK_STATE';
export const REMOVE_TASK_STATE = 'REMOVE_TASK_STATE';
export const UPDATE_CONTROL_STATE = 'UPDATE_CONTROL_STATE';
export const UPDATE_SESSION_STATE = 'UPDATE_SESSION_STATE';
export const INVOKE_CTX_OPERATION = 'INVOKE_CTX_OPERATION';
export const SET_USER_CREDENTIALS = 'SET_USER_CREDENTIALS';
export const SET_AUTH_INFO = 'SET_AUTH_INFO';
export const LOGOUT = 'LOGOUT';

export function login(): ThunkAction {
    return async (dispatch: Dispatch, getState: GetState) => {

        const username = getState().communication.username;
        const password = getState().communication.password;
        if (username === null || password === null) {
            return;
        }

        const authAPI = new AuthAPI();
        const webAPIConfig = authAPI.getWebAPIServiceURL(username);
        dispatch(setWebAPIServiceURL(webAPIConfig));

        dispatch(setWebAPIStatus('login'));

        let authInfo;
        try {
            authInfo = await authAPI.auth(username,
                password);
        } catch (error) {
            console.info('error: ', error);
            if (error instanceof HttpError && (error.status === 401)) {
                showToast({type: 'error', text: 'Access unauthorized.'});
            } else if (error instanceof HttpError && (error.status === 403)) {
                showToast({type: 'error', text: 'Wrong username or password.'});
            } else {
                handleFetchError(error, 'Login failed');
            }
            return;
        }

        dispatch(setAuthInfo(authInfo));

        const token = getState().communication.token!;
        const user = getState().communication.user;

        function hasServer(user: User | null) {
            return user !== null && user.server !== null && user.server.length > 0 && user.pending === null;
        }

        if (!hasServer(user)) {
            const handleLaunchError = (error: any) => {
                handleFetchError(error, 'Launching of Cate service failed.');
                dispatch(setWebAPIStatus(null));
            };

            dispatch(setWebAPIStatus('launching'));

            try {
                await authAPI.startWebAPI(username, token);
            } catch (error) {
                handleLaunchError(error);
                return;
            }

            const getUserAsync = async () => {
                try {
                    return await authAPI.getUser(username, token);
                } catch (error) {
                    return null;
                }
            };

            const SECOND = 1000;
            const MINUTE = 60 * SECOND;

            invokeUntil(getUserAsync,
                hasServer,
                () => dispatch(connectWebAPIClient()),
                handleLaunchError,
                SECOND,
                15 * MINUTE);
        } else {
            dispatch(connectWebAPIClient());
        }
    };
}

export function logout(): ThunkAction {
    return async (dispatch: Dispatch, getState: GetState) => {
        const username = getState().communication.username;
        const token = getState().communication.token;
        if (username === null || token === null) {
            return;
        }
        // dispatch(storePreferences());
        dispatch(setWebAPIStatus('logoff'));
        dispatch(disconnectWebAPIClient());
        const authAPI = new AuthAPI();
        try {
            await authAPI.stopWebAPI(username, token);
        } catch (error) {
            handleFetchError(error, 'Logout failed.')
        }
        dispatch(_logout());
    };
}

function setAuthInfo(authInfo: AuthInfo): Action {
    return {type: SET_AUTH_INFO, payload: {...authInfo}}
}

function _logout(): Action {
    return {type: LOGOUT}
}

export function setWebAPIProvision(webAPIProvision: WebAPIProvision, webAPIServiceCustomURL: string = DEFAULT_SERVICE_URL): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        dispatch(_setWebAPIProvision(webAPIProvision));
        if (getState().communication.webAPIProvision === 'CustomURL') {
            dispatch(setWebAPIServiceCustomURL(webAPIServiceCustomURL));
            dispatch(connectWebAPIClient());
        }
    };
}

export function _setWebAPIProvision(webAPIProvision: WebAPIProvision): Action {
    return {type: SET_WEBAPI_PROVISION, payload: {webAPIProvision}}
}

export function setWebAPIStatus(webAPIStatus: WebAPIStatus,
                                webAPIClient: WebAPIClient | null = null): Action {
    return {type: SET_WEBAPI_STATUS, payload: {webAPIStatus, webAPIClient}};
}

export function setWebAPIServiceURL(webAPIServiceURL: string): Action {
    return {type: SET_WEBAPI_SERVICE_URL, payload: {webAPIServiceURL}};
}

export function setWebAPIServiceCustomURL(webAPIServiceCustomURL: string): Action {
    return {type: SET_WEBAPI_SERVICE_CUSTOM_URL, payload: {webAPIServiceCustomURL}};
}

export function setWebAPIServiceInfo(webAPIServiceInfo: WebAPIServiceInfo): Action {
    return {type: SET_WEBAPI_SERVICE_INFO, payload: {webAPIServiceInfo}};
}

function updateWebAPIInfoInMain(webAPIProvision: WebAPIProvision, webAPIServiceURL: string, user: User | null) {
    if (hasElectron('updateWebAPIInfoInMain')) {
        const webAPIInfo = {webAPIProvision, webAPIServiceURL, user};
        console.info('webAPIInfo:', webAPIInfo);
        electron.ipcRenderer.send('update-webapi-info', webAPIInfo);
    }
}

export function connectWebAPIClient(): ThunkAction {
    return async (dispatch: Dispatch, getState: GetState) => {
        const webAPIServiceURL = getState().communication.webAPIServiceURL;
        const webAPIProvision = getState().communication.webAPIProvision;
        const user = getState().communication.user;
        updateWebAPIInfoInMain(webAPIProvision, webAPIServiceURL, user);
        dispatch(setWebAPIStatus('connecting'));

        let serviceInfo;
        try {
            serviceInfo = await new ServiceInfoAPI().getServiceInfo(webAPIServiceURL);
        } catch (error) {
            dispatch(setWebAPIProvision(null));
            dispatch(setWebAPIStatus(null));
            handleFetchError(error, 'Failed to retrieve service information');
            return;
        }

        // TODO: check if serverInfo.version is in expected version range (#30), otherwise error

        dispatch(setWebAPIServiceInfo(serviceInfo));


        const webAPIClient = newWebAPIClient(selectors.apiWebSocketsUrlSelector(getState()));

        webAPIClient.onOpen = () => {
            dispatch(setWebAPIStatus('open', webAPIClient));
            dispatch(loadBackendConfig());
            dispatch(loadColorMaps());
            dispatch(loadDataStores());
            dispatch(loadOperations());
            dispatch(loadInitialWorkspace());
            dispatch(loadPreferences());
        };

        const formatMessage = (message: string, event: any): string => {
            if (event.message) {
                return `${message} (${event.message})`;
            } else {
                return message;
            }
        };

        webAPIClient.onClose = (event) => {
            console.error('webAPIClient.onClose:', event);
            if (getState().communication.webAPIStatus === 'logoff') {
                // When we are logging off, the webAPIClient is expected to close.
                return;
            }
            dispatch(setWebAPIStatus('closed'));
            showToast({type: 'notification', text: formatMessage('Connection to Cate service closed', event)});
        };

        webAPIClient.onError = (event) => {
            console.error('webAPIClient.onError:', event);
            dispatch(setWebAPIStatus('error'));
            showToast({type: 'error', text: formatMessage('Error connecting to Cate service', event)});
        };

        webAPIClient.onWarning = (event) => {
            console.warn('webAPIClient.onWarning:', event);
            showToast({type: 'warning', text: formatMessage('Warning from Cate service', event)});
        };
    };
}

function disconnectWebAPIClient(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const webAPIClient = getState().communication.webAPIClient;
        if (webAPIClient !== null) {
            webAPIClient.close();
        }
        updateWebAPIInfoInMain(null, null, null);
    };
}

export function updateInitialState(initialState: Object): Action {
    return {type: UPDATE_INITIAL_STATE, payload: initialState};
}

export function setUserCredentials(username: string, password: string) {
    return {type: SET_USER_CREDENTIALS, payload: {username, password}};
}

export function updateDialogState(dialogId: string, ...dialogState: any): Action {
    return {type: UPDATE_DIALOG_STATE, payload: {dialogId, dialogState: Object.assign({}, ...dialogState)}};
}

export function showDialog(dialogId: string, dialogState?: any): Action {
    return updateDialogState(dialogId, dialogState, {isOpen: true});
}

export function hideDialog(dialogId: string, dialogState?: any): Action {
    return updateDialogState(dialogId, dialogState, {isOpen: false});
}

export function updateTaskState(jobId: number, taskState: TaskState): Action {
    return {type: UPDATE_TASK_STATE, payload: {jobId, taskState}};
}

export function removeTaskState(jobId: number): Action {
    return {type: REMOVE_TASK_STATE, payload: {jobId}};
}

export function setControlProperty(propertyName: keyof ControlState, value: any): Action {
    return updateControlState({[propertyName]: value});
}

export function invokeCtxOperation(operation: OperationState, inputAssignments: InputAssignments): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {

        const resource = selectors.selectedResourceSelector(getState());
        if (resource) {
            for (let input of operation.inputs) {
                if (!isInputAssigned(inputAssignments, input.name)
                    && isAssignableFrom(input.dataType, resource.dataType)) {
                    inputAssignments = assignResourceNameInput(inputAssignments, input.name, resource.name);
                    break;
                }
            }
        }

        const variable = selectors.selectedVariableSelector(getState());
        if (variable) {
            for (let input of operation.inputs) {
                if (!isInputAssigned(inputAssignments, input.name)
                    && (input.dataType === VAR_NAME_LIKE_TYPE || input.dataType === VAR_NAMES_LIKE_TYPE)) {
                    inputAssignments = assignConstantValueInput(inputAssignments, input.name, variable.name);
                    break;
                }
            }
        }

        dispatch(invokeCtxOperationImpl(operation.name, inputAssignments));
    };
}

export function invokeCtxOperationImpl(selectedCtxOperationName: string, inputAssignments: InputAssignments): Action {
    return {type: INVOKE_CTX_OPERATION, payload: {selectedCtxOperationName, inputAssignments}};
}

export function updateControlState(controlState: Partial<ControlState>): Action {
    return {type: UPDATE_CONTROL_STATE, payload: controlState};
}

export function loadPreferences(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            return selectors.remoteStorageAPISelector(getState()).getPreferences();
        }

        function action(session: SessionState) {
            dispatch(updateSessionState(session));
            dispatch(sendPreferencesToMain());
        }

        function planB(jobFailure: JobFailure) {
            dispatch(showMessageBox({
                type: 'error',
                title: 'Loading Preferences',
                message: 'Failed to load preferences.',
                detail: jobFailure.message
            }));
        }

        callAPI({
            title: `Loading Preferences`,
            dispatch, call, action, planB, requireDoneNotification: true
        });
    }
}


export function updatePreferences(session: Partial<SessionState>, sendToMain: boolean = true): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            return selectors.remoteStorageAPISelector(getState()).setPreferences(session);
        }

        function action(session: Partial<SessionState>) {
            dispatch(updateSessionState(session));
            if (sendToMain) {
                dispatch(sendPreferencesToMain());
            }
        }

        function planB(jobFailure: JobFailure) {
            dispatch(showMessageBox({
                type: 'error',
                title: 'Save Preferences',
                message: 'Failed to save workspace.',
                detail: jobFailure.message
            }));
        }

        callAPI({
            title: `Save Preferences`,
            dispatch, call, action, planB, requireDoneNotification: true
        });
    }
}


export function setSessionProperty(propertyName: keyof SessionState, value: any): Action {
    return updateSessionState({[propertyName]: value});
}

export function updateSessionState(sessionState: Partial<SessionState>): Action {
    return {type: UPDATE_SESSION_STATE, payload: sessionState};
}

export function loadBackendConfig(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            // Get state from the Python back-end
            return selectors.backendConfigAPISelector(getState()).getBackendConfig();
        }

        function action(backendConfig: BackendConfigState) {
            dispatch(updateBackendConfig(backendConfig));
        }

        callAPI({title: 'Load configuration', dispatch, call, action});
    };
}

export function updateBackendConfig(backendConfig: BackendConfigState): Action {
    return updateSessionState({backendConfig});
}

export function storeBackendConfig(backendConfig: BackendConfigState): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            // Store state changes to the Python back-end
            return selectors.backendConfigAPISelector(getState()).setBackendConfig(backendConfig);
        }

        callAPI({title: 'Store configuration', dispatch, call});
    };
}

export function cancelJob(jobId: number): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const webAPIClient = selectors.webAPIClientSelector(getState());
        webAPIClient.cancel(jobId);
    }
}

function jobSubmitted(jobId: number, jobTitle: string, requestLock?: string): Action {
    return updateTaskState(jobId, {status: JobStatusEnum.SUBMITTED, title: jobTitle, requestLock: requestLock});
}

function jobProgress(progress: JobProgress): Action {
    return updateTaskState(progress.id, {status: JobStatusEnum.IN_PROGRESS, progress});
}

function jobDone(jobId: number): Action {
    return updateTaskState(jobId, {status: JobStatusEnum.DONE});
}

function jobFailed(jobId: number,
                   jobTitle: string,
                   failure: JobFailure,
                   dispatch: (action: Action) => void,
                   notificationDisabled: boolean): void {
    const status = failure.code === ERROR_CODE_CANCELLED ? JobStatusEnum.CANCELLED : JobStatusEnum.FAILED;
    let type, text, action;
    if (status === JobStatusEnum.CANCELLED) {
        type = 'notification';
        text = `Cancelled: ${jobTitle}`;
    } else {
        type = 'error';
        text = failure.message || `Failed: ${jobTitle}`;
        action = {
            text: 'Details',
            onClick: () => {
                dispatch(showJobFailureDetails(jobTitle, failure));
            }
        };
    }
    dispatch(updateTaskState(jobId, {status, failure}));
    if (!notificationDisabled) {
        if (failure.code === ERROR_CODE_INVALID_PARAMS) {
            dispatch(showJobFailureDetails(jobTitle, failure));
        } else {
            showToast({type, text, action} as MessageState);
        }
    }
}

export function showJobFailureDetails(jobTitle: string, jobFailure: JobFailure): Action {
    return showDialog('jobFailureDialog', {jobTitle, jobFailure});
}

export type JobPromiseFactory<T> = (jobProgressHandler: JobProgressHandler) => JobPromise<T>;
export type JobPromiseAction<T> = (jobResult: T) => void;
export type JobPromisePlanB = (jobFailure: JobFailure) => void;

interface CallAPIOptions<T> {
    /** The actual API call. */
    call: JobPromiseFactory<T>;
    /** A human-readable title for the job that is being created. */
    title: string;
    /** Redux' dispatch() function. */
    dispatch: (action: Action) => void;
    /** The action to be performed when the API call succeeds. */
    action?: JobPromiseAction<T>;
    /** A lock to prevent multiple invocations. */
    requestLock?: string;
    /** The action to be performed when the API call fails. */
    planB?: JobPromisePlanB;
    /** If true, no notifications about job status will be delivered, except errors. */
    disableNotifications?: boolean;
    /** If true, a notification is shown when done even when no start notification was shown (due to startToastDelay). */
    requireDoneNotification?: boolean;
    /** Delay in milliseconds before a toast is shown. */
    startToastDelay?: number;
}

/**
 * Call some (remote) API asynchronously.
 *
 * @param options Options that control the API call.
 */
export function callAPI<T>(options: CallAPIOptions<T>): void {
    const {
        call,
        title,
        dispatch,
        action,
        requestLock,
        planB,
        disableNotifications = false,
        requireDoneNotification = false,
        startToastDelay = 500,
    } = options;

    const onProgress = (progress: JobProgress) => {
        if (!disableNotifications) {
            dispatch(jobProgress(progress));
        }
    };
    const jobPromise = call(onProgress);

    let startToastShown = false;
    let startToastTimeoutHandler: any;
    if (!disableNotifications) {
        startToastTimeoutHandler = setTimeout(() => {
            showToast({type: 'notification', text: 'Started: ' + title});
            startToastShown = true;
        }, startToastDelay);
        dispatch(jobSubmitted(jobPromise.getJobId(), title, requestLock));
    }

    const onDone = (jobResult: T) => {
        if (!disableNotifications) {
            clearTimeout(startToastTimeoutHandler);
            if (startToastShown || requireDoneNotification) {
                showToast({type: 'success', text: 'Done: ' + title});
            }
            dispatch(jobDone(jobPromise.getJobId()));
        }
        if (action) {
            action(jobResult);
        }
    };
    const onFailure = (jobFailure: JobFailure) => {
        if (!disableNotifications) {
            if (!startToastShown) {
                clearTimeout(startToastTimeoutHandler);
            }
        }
        // Always show errors in TASKS panel
        jobFailed(jobPromise.getJobId(), title, jobFailure, dispatch, disableNotifications);
        if (planB) {
            planB(jobFailure);
        }
    };

    jobPromise.then(onDone, onFailure);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Globe State

export const SET_GLOBE_MOUSE_POSITION = 'SET_GLOBE_MOUSE_POSITION';
export const SET_GLOBE_VIEW_POSITION = 'SET_GLOBE_VIEW_POSITION';

export function setGlobeMousePosition(position: GeographicPosition): Action {
    return {type: SET_GLOBE_MOUSE_POSITION, payload: {position}};
}


function setGlobeViewPositionImpl(position: GeographicPosition | null,
                                  positionData: { [varName: string]: number } | null): Action {
    return {type: SET_GLOBE_VIEW_POSITION, payload: {position, positionData}};
}

export function setGlobeViewPosition(position: GeographicPosition): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        if (position) {
            // TODO: using selectedRightBottomPanelID is no good indicator for checking VARIABLES panel visibility.
            const selectedRightBottomPanelID = selectors.selectedRightBottomPanelIdSelector(getState());
            if (selectedRightBottomPanelID === 'variables') {
                const baseDir = selectors.workspaceBaseDirSelector(getState());
                if (!baseDir) {
                    // Workspace not yet ready, that's ok.
                    return;
                }
                const resource = selectors.selectedResourceSelector(getState());
                const layer = selectors.selectedVariableImageLayerSelector(getState());
                if (layer && resource) {
                    const indexers = getNonSpatialIndexers(resource, layer);

                    const call = () => {
                        return selectors.datasetAPISelector(getState()).extractPixelValues(baseDir,
                            resource.name,
                            [position.longitude, position.latitude],
                            indexers);
                    };

                    const action = (positionData: { [varName: string]: number }) => {
                        dispatch(setGlobeViewPositionImpl(position, positionData));
                    };

                    callAPI({title: 'Load cell values', dispatch, call, action, disableNotifications: true});
                    return;
                }
            }
        } else {
            dispatch(setGlobeViewPositionImpl(null, null));
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// File-system actions

export const UPDATE_FS_ROOT_NODE = 'UPDATE_FS_ROOT_NODE';

function updateFsRootNode(path: string, updatedFileNode: FileNode): Action {
    return {type: UPDATE_FS_ROOT_NODE, payload: {path, updatedFileNode}};
}

export function updateFileNode(path: string, force: boolean): ThunkAction {
    path = sanitizePath(path);
    const pathComponents = path.split('/');

    return (dispatch: Dispatch, getState: GetState) => {
        const api = selectors.fileSystemAPISelector(getState());
        if (api === null) {
            console.error('fileSystemAPI not ready');
            return;
        }
        // Get all the subPaths of path that must be updated:
        const subPathsToBeUpdated: string[] = [];
        pathComponents.forEach((name, depth) => {
            const subPath = pathComponents.slice(0, depth + 1).join('/');
            if (subPathsToBeUpdated.length === 0) {
                const subNode = getFileNode(getState().data.fsRootNode, subPath);
                if (!subNode) {
                    subPathsToBeUpdated.push('');
                    subPathsToBeUpdated.push(subPath);
                } else if (!subNode.status || force) {
                    subPathsToBeUpdated.push(subPath);
                }
            } else {
                // Also add all sub-paths
                subPathsToBeUpdated.push(subPath);
            }
        });
        dispatch(updateSubPathFileNode(subPathsToBeUpdated, force));
    }
}

function updateSubPathFileNode(subPaths: string[], force: boolean): ThunkAction {

    return (dispatch: Dispatch, getState: GetState) => {
        if (subPaths.length === 0) {
            return;
        }

        const api = selectors.fileSystemAPISelector(getState());
        if (api === null) {
            console.error('fileSystemAPI not ready');
            return;
        }

        const subPath = subPaths[0];
        const subNode = getFileNode(getState().data.fsRootNode, subPath);
        if (!subNode) {
            console.error(`sub-path not found in file system root node: "${subPath}"`);
            return;
        }

        if (subNode.status && !force) {
            return;
        }

        console.log(`will update:`, subPaths)

        dispatch(updateFsRootNode(subPath, {...subNode, status: 'updating'}));

        const call = () => {
            return api.updateFileNode(subPath);
        };

        const action = (updatedFileNode: FileNode) => {
            dispatch(updateFsRootNode(subPath, updatedFileNode));
            if (subPaths.length > 1) {
                dispatch(updateSubPathFileNode(subPaths.slice(1), force));
            }
        };

        const planB = (jobFailure: JobFailure) => {
            dispatch(showMessageBox({
                type: 'error',
                title: 'File System Update',
                message: 'Failed updating file in file system.',
                detail: jobFailure.message
            }));
        };

        callAPI({
            title: `Updating Files`,
            dispatch, call, action, planB, requireDoneNotification: false
        });
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// (User) Placemark actions

export const ACTIVATE_NEW_PLACEMARK_TOOL = 'ACTIVATE_NEW_PLACEMARK_TOOL';
export const ADD_PLACEMARK = 'ADD_PLACEMARK';
export const REMOVE_PLACEMARK = 'REMOVE_PLACEMARK';
export const UPDATE_PLACEMARK_GEOMETRY = 'UPDATE_PLACEMARK_GEOMETRY';
export const UPDATE_PLACEMARK_PROPERTIES = 'UPDATE_PLACEMARK_PROPERTIES';
export const UPDATE_PLACEMARK_STYLE = 'UPDATE_PLACEMARK_STYLE';

export function activateNewPlacemarkTool(newPlacemarkToolType: GeometryToolType) {
    return {type: ACTIVATE_NEW_PLACEMARK_TOOL, payload: {newPlacemarkToolType}};
}

export function addPlacemark(placemark: Placemark): Action {
    return {type: ADD_PLACEMARK, payload: {placemark}};
}

export function addPointPlacemark(longitude: number, latitude: number, properties: any): Action {
    const placemark = {
        id: genSimpleId(PLACEMARK_ID_PREFIX),
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
        },
        properties,
    };
    return addPlacemark(placemark as any);
}

export function removePlacemark(placemarkId: string): Action {
    return {type: REMOVE_PLACEMARK, payload: {placemarkId}};
}

export function updatePlacemarkGeometry(placemarkId: string, geometry: DirectGeometryObject | any): Action {
    return {type: UPDATE_PLACEMARK_GEOMETRY, payload: {placemarkId, geometry}};
}

export function updatePlacemarkProperties(placemarkId: string, properties: any): Action {
    return {type: UPDATE_PLACEMARK_PROPERTIES, payload: {placemarkId, properties}};
}

export function updatePlacemarkStyle(placemarkId: string, style: SimpleStyle): Action {
    return {type: UPDATE_PLACEMARK_STYLE, payload: {placemarkId, style}};
}

export function locatePlacemark(placemarkId: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        let viewer = selectors.selectedWorldViewViewerSelector(getState());
        if (viewer) {
            let selectedEntity = getEntityByEntityId(viewer, placemarkId);
            if (selectedEntity) {
                let headingPitchRange;
                if (selectedEntity.position) {
                    let heading = 0, pitch = -3.14159 / 2, range = 2500000;
                    headingPitchRange = new Cesium.HeadingPitchRange(heading, pitch, range);
                }
                viewer.zoomTo(selectedEntity, headingPitchRange);
            }
        }
    };
}

export function setSelectedPlacemarkId(selectedPlacemarkId: string | null): Action {
    return updateSessionState({selectedPlacemarkId});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Data stores / data sources actions

export const UPDATE_DATA_STORES = 'UPDATE_DATA_STORES';
export const UPDATE_DATA_SOURCES = 'UPDATE_DATA_SOURCES';
export const UPDATE_DATA_SOURCE_TEMPORAL_COVERAGE = 'UPDATE_DATA_SOURCE_TEMPORAL_COVERAGE';

/**
 * Asynchronously load the available Cate data stores.
 * Called only a single time on app initialisation.
 *
 * @returns a Redux thunk action
 */
export function loadDataStores(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            return selectors.datasetAPISelector(getState()).getDataStores();
        }

        function action(dataStores: DataStoreState[]) {
            const offlineMode = selectors.offlineModeSelector(getState());
            if (offlineMode) {
                dataStores = dataStores.filter(ds => ds.isLocal);
            }
            dispatch(updateDataStores(dataStores));

            if (dataStores && dataStores.length) {
                let selectedDataStoreId = selectors.selectedDataStoreIdSelector(getState());
                const selectedDataStore = dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
                selectedDataStoreId = selectedDataStore ? selectedDataStore.id : dataStores[0].id;
                dispatch(setSelectedDataStoreId(selectedDataStoreId));
            }
        }

        callAPI({title: 'Loading data stores', dispatch, call, action});
    }
}


export function updateDataStores(dataStores: Array<DataStoreState>): Action {
    return {type: UPDATE_DATA_STORES, payload: {dataStores}};
}

/**
 * Asynchronously load data sources for given data store ID.
 *
 * @param dataStoreId
 * @param setSelection
 * @returns a Redux thunk action
 */
export function loadDataSources(dataStoreId: string, setSelection: boolean): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const requestLock = getLockForLoadDataSources(dataStoreId);
        if (selectors.activeRequestLocksSelector(getState()).has(requestLock)) {
            return;
        }

        function call(onProgress) {
            return selectors.datasetAPISelector(getState()).getDataSources(dataStoreId, onProgress);
        }

        function action(dataSources: DataSourceState[]) {
            dispatch(updateDataSources(dataStoreId, dataSources));
            if (setSelection) {
                let selectedDataSourceId = selectors.selectedDataSourceIdSelector(getState());
                if (dataSources && dataSources.length) {
                    const selectedDataSource = dataSources.find(dataSource => dataSource.id === selectedDataSourceId);
                    selectedDataSourceId = selectedDataSource ? selectedDataSource.id : selectedDataSourceId;
                }
                dispatch(setSelectedDataSourceId(selectedDataSourceId));
            }
        }

        const dataStore = getState().data.dataStores.find(dataStore => dataStore.id === dataStoreId);
        callAPI({
            title: `Load data sources for store "${dataStore ? dataStore.id : '?'}"`,
            dispatch,
            call,
            action,
            requestLock
        });
    }
}

export function updateDataSources(dataStoreId: string, dataSources): Action {
    return {type: UPDATE_DATA_SOURCES, payload: {dataStoreId, dataSources}};
}

export function setSelectedDataStoreId(selectedDataStoreId: string | null): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        if (getState().session.selectedDataStoreId === selectedDataStoreId) {
            //return;
        }
        dispatch(setSelectedDataStoreIdImpl(selectedDataStoreId));
        if (selectedDataStoreId !== null) {
            const dataStore = getState().data.dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
            if (!dataStore.dataSources) {
                dispatch(loadDataSources(selectedDataStoreId, true));
            }
        }
    }
}

export function setSelectedDataStoreIdImpl(selectedDataStoreId: string | null) {
    return updateSessionState({selectedDataStoreId});
}

export function setSelectedDataSourceId(selectedDataSourceId: string | null) {
    return updateSessionState({selectedDataSourceId});
}

export function setDataSourceFilterExpr(dataSourceFilterExpr: string) {
    return updateSessionState({dataSourceFilterExpr});
}

export function loadTemporalCoverage(dataStoreId: string, dataSourceId: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {

        function call(onProgress) {
            return selectors.datasetAPISelector(getState()).getDataSourceTemporalCoverage(dataStoreId, dataSourceId, onProgress);
        }

        function action(temporalCoverage) {
            dispatch(updateDataSourceTemporalCoverage(dataStoreId, dataSourceId, temporalCoverage));
        }

        callAPI({title: `Load temporal coverage for ${dataSourceId}`, dispatch, call, action});
    };
}

export function updateDataSourceTemporalCoverage(dataStoreId: string,
                                                 dataSourceId: string,
                                                 temporalCoverage: [string, string] | null): Action {
    return {type: UPDATE_DATA_SOURCE_TEMPORAL_COVERAGE, payload: {dataStoreId, dataSourceId, temporalCoverage}};
}

export function openDataset(dataSourceId: string, args: any, updateLocalDataSources: boolean): ThunkAction {
    return (dispatch: Dispatch) => {

        const opName = 'open_dataset';
        const opArgs = {
            ds_id: dataSourceId,
            ...args
        };

        // Wrap the opArgs into a new OpArgs object where each value is indicated by a "value" key.
        // The reason is that an opArg could also refer to a resource, the "source" key would be used instead.
        //
        const wrappedOpArgs = {};
        Object.keys(opArgs).forEach(name => {
            wrappedOpArgs[name] = {value: opArgs[name]};
        });
        let postSetAction;
        if (updateLocalDataSources) {
            postSetAction = (dispatch: Dispatch) => {
                dispatch(loadDataSources('local', false));
            }
        }

        dispatch(setWorkspaceResource(opName,
            wrappedOpArgs,
            null,
            false,
            `Opening data source "${dataSourceId}"`, postSetAction));
    }
}

export function addLocalDataset(dataSourceId: string, filePathPattern: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call(onProgress) {
            return selectors.datasetAPISelector(getState()).addLocalDataSource(dataSourceId, filePathPattern, onProgress);
        }

        function action(dataSources: DataSourceState[]) {
            dispatch(updateDataSources('local', dataSources));
        }

        callAPI({
            title: `Add file data source "${dataSourceId}"`,
            dispatch, call, action, requireDoneNotification: true
        });
    }
}

export function removeLocalDataset(dataSourceId: string, removeFiles: boolean): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call(onProgress) {
            return selectors.datasetAPISelector(getState()).removeLocalDataSource(dataSourceId, removeFiles, onProgress);
        }

        function action(dataSources: DataSourceState[]) {
            dispatch(updateDataSources('local', dataSources));
        }

        callAPI({
            title: `Remove copy of file data source "${dataSourceId}"`,
            dispatch, call, action, requireDoneNotification: true
        });
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Operation actions

export const UPDATE_OPERATIONS = 'UPDATE_OPERATIONS';

export function loadOperations(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {

        function call() {
            return selectors.operationAPISelector(getState()).getOperations();
        }

        function action(operations: OperationState[]) {
            dispatch(updateOperations(operations));
        }

        callAPI({title: 'Load operations', dispatch, call, action});
    };
}

export function updateOperations(operations): Action {
    return {type: UPDATE_OPERATIONS, payload: {operations}};
}

export function setSelectedOperationName(selectedOperationName: string | null) {
    return updateSessionState({selectedOperationName});
}

export function setOperationFilterTags(operationFilterTags: string[]) {
    return updateSessionState({operationFilterTags});
}

export function setOperationFilterExpr(operationFilterExpr: string) {
    return updateSessionState({operationFilterExpr});
}

export function showOperationStepDialog(dialogId: string) {
    return showDialog(dialogId);
}

export function hideOperationStepDialog(dialogId: string, inputAssignments?): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        if (inputAssignments) {
            const dialogState = getState().control.dialogs[dialogId] as any;
            inputAssignments = {...dialogState.inputAssignments, ...inputAssignments};
        }
        dispatch(hideDialog(dialogId, {inputAssignments}));
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Workspace actions

export const SET_CURRENT_WORKSPACE = 'SET_CURRENT_WORKSPACE';
export const UPDATE_WORKSPACE_NAMES = 'UPDATE_WORKSPACE_NAMES';
export const RENAME_RESOURCE = 'RENAME_RESOURCE';
export const SHOW_FIGURE_VIEW = 'SHOW_FIGURE_VIEW';
export const SHOW_ANIMATION_VIEW = 'SHOW_ANIMATION_VIEW';
export const SHOW_TABLE_VIEW = 'SHOW_TABLE_VIEW';

export function updateWorkspaceNames(workspaceNames: string[]): Action {
    return {type: UPDATE_WORKSPACE_NAMES, payload: {workspaceNames}};
}

/**
 * Asynchronously load the initial workspace.
 * Called only a single time on app initialisation.
 *
 * @returns a Redux thunk action
 */
export function loadInitialWorkspace(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const reopenLastWorkspace = getState().session.reopenLastWorkspace;
        const lastWorkspacePath = getState().session.lastWorkspacePath;
        if (reopenLastWorkspace && lastWorkspacePath) {
            dispatch(openWorkspace(lastWorkspacePath));
        } else {
            dispatch(newWorkspace(null));
        }
    }
}

/**
 * Asynchronously create a new workspace.
 *
 * @param workspacePath workspace path, if null, a new scratch workspace will be created
 * @returns a Redux thunk action
 */
export function newWorkspace(workspacePath: string | null): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            return selectors.workspaceAPISelector(getState()).newWorkspace(workspacePath);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
            dispatch(saveWorkspace());
            if (workspace && workspace.workflow.steps.length > 0) {
                dispatch(setSelectedWorkspaceResourceName(workspace.workflow.steps[0].id));
            } else {
                dispatch(setSelectedWorkspaceResourceName(null));
            }
        }

        function planB(jobFailure: JobFailure) {
            dispatch(showMessageBox({
                type: 'error',
                title: 'New Workspace',
                message: 'Failed to create new workspace.',
                detail: jobFailure.message
            }));
        }

        callAPI({
            title: 'New workspace' + (workspacePath ? ` "${workspacePath}"` : ''),
            dispatch, call, action, planB, requireDoneNotification: true
        });
    }
}

/**
 * Asynchronously open the a workspace.
 *
 * @param workspacePath workspace path
 * @returns a Redux thunk action
 */
export function openWorkspace(workspacePath?: string | null): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).openWorkspace(workspacePath, onProgress);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
            if (workspace && workspace.workflow.steps.length > 0) {
                dispatch(setSelectedWorkspaceResourceName(workspace.workflow.steps[0].id));
            } else {
                dispatch(setSelectedWorkspaceResourceName(null));
            }
        }

        function planB() {
            let workspace = getState().data.workspace;
            if (!workspace) {
                dispatch(newWorkspace(null));
            }
        }

        callAPI({
            title: `Open workspace "${workspacePath}"`,
            dispatch, call, action, planB, requireDoneNotification: true
        });
    }
}

/**
 * Asynchronously close the current workspace.
 *
 * @returns a Redux thunk action
 */
export function closeWorkspace(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call() {
            return selectors.workspaceAPISelector(getState()).closeWorkspace(baseDir);
        }

        function action() {
            dispatch(newWorkspace(null));
        }

        callAPI({
            title: 'Close workspace',
            dispatch, call, action, requireDoneNotification: true
        });
    }
}

/**
 * Asynchronously close the current workspace.
 *
 * @returns a Redux thunk action
 */
export function saveWorkspace(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        let workspace = getState().data.workspace;
        assert.ok(workspace);

        if (workspace.isScratch) {
            return saveWorkspaceAs;
        }

        const baseDir = workspace.baseDir;

        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).saveWorkspace(baseDir, onProgress);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        function planB(jobFailure: JobFailure) {
            dispatch(showMessageBox({
                type: 'error',
                title: 'Save Workspace',
                message: 'Failed to save workspace.',
                detail: jobFailure.message
            }));
        }

        callAPI({
            title: 'Save workspace',
            dispatch, call, action, planB, requireDoneNotification: true
        });
    }
}

/**
 * Asynchronously save the current workspace using a new name.
 *
 * @returns a Redux thunk action
 */
export function saveWorkspaceAs(workspacePath: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).saveWorkspaceAs(baseDir, workspacePath, onProgress);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        function planB(jobFailure: JobFailure) {
            dispatch(showMessageBox({
                type: 'error',
                title: 'Save Workspace As',
                message: 'Failed to save workspace.',
                detail: jobFailure.message
            }));
        }

        callAPI({
            title: `Save workspace as "${workspacePath}"`,
            dispatch, call, action, planB, requireDoneNotification: true
        });
    }
}

/**
 * Asynchronously clean the current workspace.
 *
 * @returns a Redux thunk action
 */
export function cleanWorkspace(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        let workspace = getState().data.workspace;
        assert.ok(workspace);
        const baseDir = workspace.baseDir;

        function call() {
            return selectors.workspaceAPISelector(getState()).cleanWorkspace(baseDir);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        callAPI({
            title: `Clean workspace "${baseDir}"`,
            dispatch, call, action, requireDoneNotification: true
        });
    }
}


/**
 * Asynchronously delete the given resource.
 *
 * @returns a Redux thunk action
 */
export function deleteResource(resName: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        let workspace = getState().data.workspace;
        assert.ok(workspace);
        const baseDir = workspace.baseDir;

        function call() {
            return selectors.workspaceAPISelector(getState()).deleteWorkspaceResource(baseDir, resName);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        callAPI({
            title: `Delete step/resource "${resName}"`, dispatch, call, action,
            requireDoneNotification: true
        });
    }
}

/**
 * Asynchronously delete the workspace with the given name.
 *
 * @returns a Redux thunk action
 */
export function deleteWorkspace(workspaceName: string, deleteEntireWorkspace = true): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {

        function call() {
            return selectors.workspaceAPISelector(getState()).deleteWorkspace(workspaceName, deleteEntireWorkspace);
        }

        callAPI({
            title: `Delete step/workspace "${workspaceName}"`, dispatch, call,
            requireDoneNotification: true
        });
    }
}


/**
 * Bring up the "New Workspace" dialog.
 *
 * @returns a Redux action
 */
export function newWorkspaceInteractive() {
    return showDialog('newWorkspaceDialog');
}

function openRemoteWorkspace(dispatch: (action: (Action | ThunkAction)) => void,
                             getState: () => State) {
    let jobPromise = selectors.workspaceAPISelector(getState()).listWorkspaces();
    jobPromise.then(workspaceNames => {
        dispatch(updateWorkspaceNames(workspaceNames));
        dispatch(showDialog(OPEN_WORKSPACE_DIALOG_ID));
    })
}

function deleteRemoteWorkspace(dispatch: (action: (Action | ThunkAction)) => void,
                               getState: () => State) {
    let jobPromise = selectors.workspaceAPISelector(getState()).listWorkspaces();
    jobPromise.then(workspaceNames => {
        dispatch(updateWorkspaceNames(workspaceNames));
        dispatch(showDialog(DELETE_WORKSPACE_DIALOG_ID));
    })
}

function openLocalWorkspace(dispatch: (action: (Action | ThunkAction)) => void,
                            getState: () => State) {
    const handleClose = (workspacePath: string | null) => {
        if (workspacePath) {
            const workspace = getState().data.workspace;
            let ok = true;
            if (workspace) {
                if (workspace.baseDir === workspacePath) {
                    // showMessageBox({
                    //     title: 'Open Workspace',
                    //     message: 'Workspace is already open.'
                    // }, MESSAGE_BOX_NO_REPLY);
                    showToast({
                        type: 'warning',
                        text: 'Workspace is already open.',
                    });
                    return;
                }
                ok = maybeSaveCurrentWorkspace(dispatch, getState,
                    'Open Workspace',
                    'Would you like to save the current workspace before opening the new one?',
                    'Press "Cancel" to cancel opening a new workspace.'
                );
            }
            if (ok) {
                dispatch(openWorkspace(workspacePath));
            }
        }
    }
    dispatch(showSingleFileOpenDialog({
        title: 'Open Workspace - Select Directory',
        buttonLabel: 'Open',
        properties: ['openDirectory'],
    }, handleClose) as any);
}

/**
 * Let user select a workspace, then ask whether to save the existing workspace, then open new one.
 *
 * @returns a Redux thunk action
 */
export function openWorkspaceInteractive(): ThunkAction {

    return (dispatch: Dispatch, getState: GetState) => {
        if (selectors.isLocalFSAccessAllowedSelector(getState())) {
            openLocalWorkspace(dispatch, getState);
        } else {
            openRemoteWorkspace(dispatch, getState);
        }
    };
}

/**
 * Let user select a workspace, then ask whether to delete the selected workspace.
 *
 * @returns a Redux thunk action
 */
export function deleteWorkspaceInteractive(): ThunkAction {

    return (dispatch: Dispatch, getState: GetState) => {
        if (!selectors.isLocalFSAccessAllowedSelector(getState())) {
            deleteRemoteWorkspace(dispatch, getState);
        }
    };
}

/**
 * Ask user to whether to save workspace, then close it.
 *
 * @returns a Redux thunk action
 */
export function closeWorkspaceInteractive(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const ok = maybeSaveCurrentWorkspace(dispatch, getState,
            'Close Workspace',
            'Would you like to save the current workspace before closing it?',
            'Press "Cancel" to cancel closing the workspace.'
        );
        if (ok) {
            dispatch(closeWorkspace())
        }
    };
}

/**
 * Ask user whether to clean workspace, then clean it.
 *
 * @returns a Redux thunk action
 */
export function cleanWorkspaceInteractive(): ThunkAction {
    return (dispatch: Dispatch) => {
        dispatch(showMessageBox({
            type: 'question',
            title: 'Clean Workspace',
            message: 'Do you really want to clean this workspace?',
            detail: 'This will delete all resources and workflow steps.\nYou will not be able to undo this operation.',
            buttons: ['Yes', 'No'],
            defaultId: 1,
            cancelId: 1,
        }, (answer) => {
            if (answer && answer.buttonIndex === 0) {
                dispatch(cleanWorkspace());
            }
        }));
    };
}

/**
 * Ask user whether to delete a resource/step, then delete it.
 *
 * @returns a Redux thunk action
 */
export function deleteResourceInteractive(resName: string): ThunkAction {
    return (dispatch: Dispatch) => {
        dispatch(showMessageBox({
            type: 'question',
            title: 'Remove Resource and Workflow Step',
            message: `Do you really want to delete resource and step "${resName}"?`,
            detail: 'This will also delete the workflow step that created it.\n' +
                'You will not be able to undo this operation.',
            buttons: ['Yes', 'No'],
            defaultId: 1,
            cancelId: 1,
        }, answer => {
            if (answer && answer.buttonIndex === 0) {
                dispatch(deleteResource(resName));
            }
        }));
    };
}

/**
 * If current workspace is scratch workspace, delegate to "save as" action" otherwise save it.
 *
 * @returns a Redux thunk action
 */
export function saveWorkspaceInteractive(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const workspace = getState().data.workspace;
        if (workspace.isScratch) {
            dispatch(saveWorkspaceAsInteractive());
        } else {
            dispatch(saveWorkspace())
        }
    };
}

/**
 * Bring up the "Save Workspace As" dialog.
 *
 * @returns a Redux action
 */
export function saveWorkspaceAsInteractive() {
    return showDialog('saveWorkspaceAsDialog');
}

/**
 * Save workspace after asking user whether to do so.
 *
 * @returns false, if action was cancelled, otherwise true
 */
function maybeSaveCurrentWorkspace(dispatch, getState: GetState, title: string, message: string, detail?: string): boolean {
    const workspace = getState().data.workspace;
    if (workspace) {
        const maySave = workspace.workflow.steps.length && (workspace.isModified || !workspace.isSaved);
        if (maySave) {
            dispatch(showMessageBox({
                type: 'question',
                title,
                message,
                detail,
                buttons: ['Yes', 'No', 'Cancel'],
                defaultId: 0,
                cancelId: 2,
            }, answer => {

                if (answer) {
                    if (answer.buttonIndex === 0) {
                        if (workspace.isScratch) {
                            dispatch(saveWorkspaceAsInteractive());
                        } else {
                            dispatch(saveWorkspace());
                        }
                    } else if (answer.buttonIndex === 2) {
                        return false;
                    }
                } else {
                    return false;
                }
            }));
        }
    }
    return true;
}

export function setCurrentWorkspace(workspace: WorkspaceState): ThunkAction {
    return (dispatch: Dispatch) => {
        dispatch(setCurrentWorkspaceImpl(workspace));
        if (!workspace.isScratch) {
            dispatch(updatePreferences({lastWorkspacePath: workspace.baseDir} as any, true));
        }
    }
}

function setCurrentWorkspaceImpl(workspace: WorkspaceState): Action {
    return {type: SET_CURRENT_WORKSPACE, payload: {workspace}};
}

export function setSelectedWorkspaceResourceName(selectedWorkspaceResourceName: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        dispatch(setSelectedWorkspaceResourceNameImpl(selectedWorkspaceResourceName));
        if (selectedWorkspaceResourceName && getState().data.workspace) {
            const resources: Array<ResourceState> = getState().data.workspace.resources;
            if (resources) {
                const resource = resources.find(res => res.name === selectedWorkspaceResourceName);
                if (resource && resource.variables && resource.variables.length) {
                    const variable = resource.variables.find(variable => !!variable.isDefault);
                    dispatch(setSelectedVariable(resource,
                        variable || resource.variables[0],
                        selectors.savedLayersSelector(getState())));
                }
            }
        }
    }
}

function setSelectedWorkspaceResourceNameImpl(selectedWorkspaceResourceName: string): Action {
    return updateControlState({selectedWorkspaceResourceName});
}

export function setSelectedWorkflowStepId(selectedWorkflowStepId: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        if (selectedWorkflowStepId) {
            const resourceMap = selectors.resourceMapSelector(getState());
            const resource = resourceMap[selectedWorkflowStepId];
            if (resource) {
                dispatch(setSelectedWorkspaceResourceName(resource.name));
            }
        }
        dispatch(setSelectedWorkflowStepIdImpl(selectedWorkflowStepId));
    };
}

function setSelectedWorkflowStepIdImpl(selectedWorkflowStepId: string): Action {
    return updateControlState({selectedWorkflowStepId});
}

export function setWorkspaceResource(opName: string,
                                     opArgs: OperationKWArgs,
                                     resName: string | null,
                                     overwrite: boolean,
                                     title: string,
                                     postSetAction?): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).setWorkspaceResource(baseDir,
                opName,
                opArgs,
                resName,
                overwrite,
                onProgress);
        }

        function action(result: [WorkspaceState, string]) {
            const workspace = result[0];
            const resName = result[1];
            dispatch(setCurrentWorkspace(workspace));

            const resource = findResourceByName(selectors.resourcesSelector(getState()), resName);
            const isFigure = isFigureResource(resource);
            const isAnimation = isAnimationResource(resource);
            if (!isFigure && !isAnimation) {
                dispatch(setSelectedWorkspaceResourceName(resName));
            }
            if ((isFigure || isAnimation) && getState().session.autoShowNewFigures) {
                if (isFigure) {
                    dispatch(showFigureView(resource, selectors.activeViewIdSelector(getState())))
                } else if (isAnimation) {
                    dispatch(showAnimationView(resource, selectors.activeViewIdSelector(getState())))
                }
            }
            if (postSetAction) {
                dispatch(postSetAction);
            }
        }

        callAPI({dispatch, title, call, action, requireDoneNotification: true});
    }
}

export function setWorkspaceResourcePersistence(resName: string, persistent: boolean): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call() {
            return selectors.workspaceAPISelector(getState()).setWorkspaceResourcePersistence(baseDir, resName, persistent);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
        }

        callAPI({title: 'Change resource persistence', dispatch, call, action});
    }
}

export function renameWorkspaceResource(resName: string, newResName: string): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call() {
            return selectors.workspaceAPISelector(getState()).renameWorkspaceResource(baseDir, resName, newResName);
        }

        function action(workspace: WorkspaceState) {
            dispatch(setCurrentWorkspace(workspace));
            dispatch(renameWorkspaceResourceImpl(resName, newResName));
        }

        callAPI({title: 'Rename resource', dispatch, call, action});
    };
}

export function renameWorkspaceResourceImpl(resName: string, newResName: string): Action {
    return {type: RENAME_RESOURCE, payload: {resName, newResName}};
}

export function getWorkspaceVariableStatistics(resName: string,
                                               varName: string,
                                               varIndex: number[],
                                               action: (statistics: ImageStatisticsState) => any): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        assert.ok(baseDir);

        function call(onProgress) {
            return selectors.workspaceAPISelector(getState()).getWorkspaceVariableStatistics(baseDir,
                resName,
                varName,
                varIndex,
                onProgress);
        }

        function action2(statistics: ImageStatisticsState) {
            dispatch(action(statistics));
        }

        const title = `Computing statistics for variable "${varName}"`;
        const requestLock = getLockForGetWorkspaceVariableStatistics(resName, varName, varIndex);
        callAPI({title, dispatch, call, action: action2, requestLock});
    }
}

export function showTableView(resName: string, varName: string | null, placeAfterViewId: string | null): Action {
    return {type: SHOW_TABLE_VIEW, payload: {resName, varName, placeAfterViewId}};
}

export function showFigureView(resource: ResourceState, placeAfterViewId: string | null): Action {
    return {type: SHOW_FIGURE_VIEW, payload: {resource, placeAfterViewId}};
}

export function showAnimationView(resource: ResourceState, placeAfterViewId: string | null): Action {
    return {type: SHOW_ANIMATION_VIEW, payload: {resource, placeAfterViewId}};
}

// noinspection JSUnusedLocalSymbols
export function saveFigureImageAs(imageUrl: string, figureId: number): ThunkAction {
    return () => {
        if (!electron) {
            return;
        }
        // console.log("saveFigureImageAs: ", imageUrl, figureId);
        electron.shell.openExternal(imageUrl + '/png');

        // showFileSaveDialog({
        //     title: "Save Figure As",
        //     filters: [
        //         {name: 'Images', extensions: ["png", "jpeg", "tif"]},
        //         {name: 'Other', extensions: ["eps", "pdf", "ps", "raw", "svg"]},
        //     ]
        // }, (filePath: string) => {
        //     console.log("saveFigureImageAs:", filePath);
        // });
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Variable actions

export const SET_SHOW_SELECTED_VARIABLE_LAYER = 'SET_SHOW_SELECTED_VARIABLE_LAYER';
export const SET_SELECTED_VARIABLE = 'SET_SELECTED_VARIABLE';

export function setShowSelectedVariableLayer(showSelectedVariableLayer: boolean): Action {
    return {type: SET_SHOW_SELECTED_VARIABLE_LAYER, payload: {showSelectedVariableLayer}};
}

export function setSelectedVariable(resource: ResourceState,
                                    selectedVariable: VariableState | null,
                                    savedLayers?: SavedLayers): Action {
    return {type: SET_SELECTED_VARIABLE, payload: {resource, selectedVariable, savedLayers}};
}

export function addVariableLayer(viewId: string,
                                 resource: ResourceState,
                                 variable: VariableState,
                                 selectLayer: boolean,
                                 savedLayers?: { [name: string]: LayerState }) {
    let layer = newVariableLayer(resource, variable, savedLayers);
    return addLayer(viewId, layer, selectLayer);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ApplicationPage actions

export function setLeftPanelContainerLayout(leftPanelContainerLayout: PanelContainerLayout) {
    return updateSessionState({leftPanelContainerLayout});
}

export function setRightPanelContainerLayout(rightPanelContainerLayout: PanelContainerLayout) {
    return updateSessionState({rightPanelContainerLayout});
}

export function setSelectedLeftTopPanelId(selectedLeftTopPanelId: string | null) {
    return updateSessionState({selectedLeftTopPanelId});
}

export function setSelectedLeftBottomPanelId(selectedLeftBottomPanelId: string | null) {
    return updateSessionState({selectedLeftBottomPanelId});
}

export function setSelectedRightTopPanelId(selectedRightTopPanelId: string | null) {
    return updateSessionState({selectedRightTopPanelId});
}

export function setSelectedRightBottomPanelId(selectedRightBottomPanelId: string | null) {
    return updateSessionState({selectedRightBottomPanelId});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ViewManager actions

export const ADD_WORLD_VIEW = 'ADD_WORLD_VIEW';
export const ADD_TABLE_VIEW = 'ADD_TABLE_VIEW';
export const SELECT_VIEW = 'SELECT_VIEW';
export const CLOSE_VIEW = 'CLOSE_VIEW';
export const CLOSE_ALL_VIEWS = 'CLOSE_ALL_VIEWS';
export const SPLIT_VIEW_PANEL = 'SPLIT_VIEW_PANEL';
export const CHANGE_VIEW_SPLIT_POS = 'CHANGE_VIEW_SPLIT_POS';
export const MOVE_VIEW = 'MOVE_VIEW';


export function addWorldView(placeAfterViewId: string | null): Action {
    return {type: ADD_WORLD_VIEW, payload: {placeAfterViewId}};
}

export function selectView(viewPath: ViewPath, viewId: string): Action {
    return {type: SELECT_VIEW, payload: {viewPath, viewId}};
}

export function closeView(viewPath: ViewPath, viewId: string): Action {
    return {type: CLOSE_VIEW, payload: {viewPath, viewId}};
}

export function closeAllViews(viewPath: ViewPath): Action {
    return {type: CLOSE_ALL_VIEWS, payload: {viewPath}};
}

export function splitViewPanel(viewPath: ViewPath, dir: SplitDir, pos: number): Action {
    return {type: SPLIT_VIEW_PANEL, payload: {viewPath, dir, pos}};
}

export function changeViewSplitPos(viewPath: ViewPath, delta: number): Action {
    return {type: CHANGE_VIEW_SPLIT_POS, payload: {viewPath, delta}};
}

export function moveView(sourceViewId: string, placement: 'before' | 'after', targetViewId: string): Action {
    return {type: MOVE_VIEW, payload: {sourceViewId, placement, targetViewId}};
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// World view actions

export const SET_VIEW_MODE = 'SET_VIEW_MODE';
export const SET_PROJECTION_CODE = 'SET_PROJECTION_CODE';
export const SET_LAYER_SPLIT_MODE = 'SET_LAYER_SPLIT_MODE';
export const SET_LAYER_SPLIT_POSITION = 'SET_LAYER_SPLIT_POSITION';
export const SET_SELECTED_ENTITY_ID = 'SET_SELECTED_ENTITY_ID';
export const INC_ENTITY_UPDATE_COUNT = 'INC_ENTITY_UPDATE_COUNT';
export const UPDATE_ENTITY_STYLE = 'UPDATE_ENTITY_STYLE';
export const UPDATE_MOUSE_IDLE_STATE = 'UPDATE_MOUSE_IDLE_STATE';

export function setViewMode(viewId: string, viewMode: WorldViewMode): Action {
    return {type: SET_VIEW_MODE, payload: {viewId, viewMode}};
}

export function setLayerSplitMode(viewId: string, layerId: string, splitMode: SplitMode): Action {
    return {type: SET_LAYER_SPLIT_MODE, payload: {viewId, layerId, splitMode}};
}

export function setLayerSplitPosition(viewId: string, layerSplitPosition: number): Action {
    return {type: SET_LAYER_SPLIT_POSITION, payload: {viewId, layerSplitPosition}};
}

export function notifySelectedEntityChange(viewId: string, layer: LayerState | null, selectedEntity: Cesium.Entity | null): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {

        const selectedEntityId = selectedEntity && selectedEntity.id;
        dispatch(setSelectedEntityId(viewId, isDefined(selectedEntityId) ? selectedEntityId : null));

        if (selectedEntity
            && isNumber(selectedEntity['_simp'])
            && isNumber(selectedEntity['_resId'])
            && isNumber(selectedEntity['_idx'])) {
            const isGeometrySimplified = (selectedEntity['_simp'] & 0x01) !== 0;
            if (isGeometrySimplified) {
                const workspace = selectors.workspaceSelector(getState());
                if (workspace) {
                    const resId = selectedEntity['_resId'];
                    const featureIndex = +selectedEntity['_idx'];
                    const baseUrl = selectors.webAPIRestUrlSelector(getState());
                    const baseDir = workspace.baseDir;
                    const featureUrl = getFeatureUrl(baseUrl, baseDir, {resId}, featureIndex);
                    reloadEntityWithOriginalGeometry(selectedEntity, featureUrl, (layer as any).style);
                }
            }
        }
    }
}

function setSelectedEntityId(viewId: string, selectedEntityId: string | null): Action {
    return {type: SET_SELECTED_ENTITY_ID, payload: {viewId, selectedEntityId}};
}

export function updateEntityStyle(view: ViewState<any>, entity: Cesium.Entity, style: SimpleStyle) {
    return (dispatch: Dispatch) => {
        const layer = getWorldViewVectorLayerForEntity(view, entity);
        // We cannot dispatch an action with an entity payload, because action logging will no longer work
        // (probably because Cesium Entities are not plain objects and contain numerous references
        // to other complex Cesium objects).
        // This is why we pass an the entity ID as payload.
        // However entity IDs are only unique within a Cesium Entity DataSource / Cate Vector Layer,
        // therefore must pass the layer ID and the entity ID to identify the entity.
        if (layer) {
            // We will only dispatch actions for entities belong to our own layers.
            if (layer.id === MY_PLACES_LAYER_ID) {
                // If this is the placemarks layer, we store the style change in the placemarks (= feature's)
                // properties: state.session.placemarkCollection.features[entityId].properties = ...style
                dispatch(updatePlacemarkStyle(entity.id, style));
            } else {
                // For all other layer we update the layer's entity styles:
                // properties: state.control.views[viewId].data.layers[layerId].entityStyles[entityId] = style
                dispatch(updateEntityStyleImpl(view.id, layer.id, entity.id, style));
            }
        }
        dispatch(incEntityUpdateCount());
    };
}

function updateEntityStyleImpl(viewId: string, layerId: string, entityId: string, style: SimpleStyle): Action {
    return {type: UPDATE_ENTITY_STYLE, payload: {viewId, layerId, entityId, style}};
}

function incEntityUpdateCount(): Action {
    return {type: INC_ENTITY_UPDATE_COUNT};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Table view actions

export const UPDATE_TABLE_VIEW_DATA = 'UPDATE_TABLE_VIEW_DATA';

export function updateTableViewData(viewId: string,
                                    resName: string | null,
                                    varName: string | null,
                                    dataRows?: any[] | null,
                                    error?: any,
                                    isLoading?: boolean): Action {
    dataRows = dataRows || null;
    error = error || null;
    isLoading = isLoading || false;
    return {type: UPDATE_TABLE_VIEW_DATA, payload: {viewId, resName, varName, dataRows, error, isLoading}};
}

export function loadTableViewData(viewId: string, resName: string, varName: string | null): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const restUrl = selectors.webAPIRestUrlSelector(getState());
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        const resource = selectors.resourcesSelector(getState()).find(res => res.name === resName);
        if (resource) {
            const csvUrl = getCsvUrl(restUrl, baseDir, {resId: resource.id}, varName);
            dispatch(updateTableViewData(viewId, resName, varName, null, null, true));
            d3.csv(csvUrl)
                .then((dataRows: any[]) => {
                    dispatch(updateTableViewData(viewId, resName, varName, dataRows, null, false));
                })
                .catch((error: any) => {
                    dispatch(updateTableViewData(viewId, resName, varName, null, error, false));
                });
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Animation view actions

export const UPDATE_ANIMATION_VIEW_DATA = 'UPDATE_ANIMATION_VIEW_DATA';

export function loadAnimationViewData(viewId: string, resId: number): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const restUrl = selectors.webAPIRestUrlSelector(getState());
        const baseDir = selectors.workspaceBaseDirSelector(getState());
        const htmlUrl = getHtmlUrl(restUrl, baseDir, resId);

        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4) {
                dispatch(setAnimationResult(viewId, xmlHttp.responseText, xmlHttp.status));
            }
        };
        xmlHttp.open('GET', htmlUrl, true); // true for asynchronous
        xmlHttp.send(null);
    }
}

function setAnimationResult(viewId: string, innerHTML: string, status: number) {
    return {type: UPDATE_ANIMATION_VIEW_DATA, payload: {viewId, innerHTML, status}}
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Layer actions

export const SET_SELECTED_LAYER_ID = 'SET_SELECTED_LAYER_ID';
export const ADD_LAYER = 'ADD_LAYER';
export const REMOVE_LAYER = 'REMOVE_LAYER';
export const UPDATE_LAYER = 'UPDATE_LAYER';
export const UPDATE_LAYER_STYLE = 'UPDATE_LAYER_STYLE';
export const MOVE_LAYER_UP = 'MOVE_LAYER_UP';
export const MOVE_LAYER_DOWN = 'MOVE_LAYER_DOWN';
export const SAVE_LAYER = 'SAVE_LAYER';

export function setSelectedLayerId(viewId: string, selectedLayerId: string | null): Action {
    return {type: SET_SELECTED_LAYER_ID, payload: {viewId, selectedLayerId}};
}

export function addLayer(viewId: string, layer: LayerState, selectLayer: boolean): Action {
    return {type: ADD_LAYER, payload: {viewId, layer, selectLayer}};
}

export function removeLayer(viewId: string, id: string): Action {
    return {type: REMOVE_LAYER, payload: {viewId, id}};
}

export function moveLayerUp(viewId: string, id: string): Action {
    return {type: MOVE_LAYER_UP, payload: {viewId, id}};
}

export function moveLayerDown(viewId: string, id: string): Action {
    return {type: MOVE_LAYER_DOWN, payload: {viewId, id}};
}

export function updateLayer(viewId: string, layer: LayerState, ...layerProperties): ThunkAction {
    return (dispatch: Dispatch) => {
        if (layerProperties.length) {
            layer = updateObject({}, layer, ...layerProperties);
        }
        dispatch(updateLayerImpl(viewId, layer));
        if (layer.id === AUTO_LAYER_ID) {
            const varName = (layer as VariableLayerBase).varName;
            if (varName) {
                dispatch(saveLayer(varName, layer));
            }
        }
    };
}

function updateLayerImpl(viewId: string, layer: LayerState): Action {
    return {type: UPDATE_LAYER, payload: {viewId, layer}};
}

export function updateLayerStyle(viewId: string, layerId: string, style: SimpleStyle): Action {
    return {type: UPDATE_LAYER_STYLE, payload: {viewId, layerId, style}};
}

/**
 * Save layer (in state.session), so it can later be restored.
 *
 * @param key a key
 * @param layer layer data
 * @returns {{type: string, payload: {key: string, layer: LayerState}}}
 */
export function saveLayer(key: string, layer: LayerState): Action {
    return {type: SAVE_LAYER, payload: {key, layer}};
}

export function setStyleContext(styleContext: StyleContext) {
    return updateSessionState({styleContext});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ColorMap actions

export const UPDATE_COLOR_MAPS = 'UPDATE_COLOR_MAPS';

/**
 * Asynchronously load the initial workspace.
 * Called only a single time on app initialisation.
 *
 * @returns a Redux thunk action
 */
export function loadColorMaps(): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        function call() {
            return selectors.colorMapsAPISelector(getState()).getColorMaps();
        }

        function action(colorMaps: Array<ColorMapCategoryState>) {
            dispatch(updateColorMaps(colorMaps));
        }

        callAPI({title: 'Load color maps', dispatch, call, action});
    }
}

function updateColorMaps(colorMaps: Array<ColorMapCategoryState>): Action {
    return {type: UPDATE_COLOR_MAPS, payload: {colorMaps}};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// (User) Preferences actions

export function showPreferencesDialog() {
    return showDialog('preferencesDialog');
}

export function hidePreferencesDialog() {
    return hideDialog('preferencesDialog');
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// File choosers and message boxes

export const OPEN_DIRECTORY_SELECT_DIALOG = 'OPEN_DIRECTORY_SELECT_DIALOG';
export const CLOSE_DIRECTORY_SELECT_DIALOG = 'CLOSE_DIRECTORY_SELECT_DIALOG';

function openDirectorySelectDialog(options: OpenDialogOptions,
                                   onClose: (result: OpenDialogResult) => any): Action {
    return {type: OPEN_DIRECTORY_SELECT_DIALOG, payload: {options, onClose}};
}

function closeDirectorySelectDialog(result: OpenDialogResult): Action {
    return {type: CLOSE_DIRECTORY_SELECT_DIALOG, payload: {result}};
}

/**
 * Shows a single-directory select dialog.
 * Similar to "showFileOpenDialog" but will always return a single directory path or null.
 *
 * @param openDialogOptions the file-open dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param onClose a function which is called with the selected directory path or null if the dialog was canceled
 * @returns a thunk action
 */
export function showDirectorySelectDialog(openDialogOptions: OpenDialogOptions,
                                          onClose: (dirPath: string | null) => void): ThunkAction {
    const propsSet = new Set(openDialogOptions.properties);
    propsSet.delete('openFile');
    propsSet.delete('multiSelections');
    propsSet.add('openDirectory');
    openDialogOptions = {
        ...openDialogOptions,
        title: openDialogOptions.title || 'Select Directory',
        buttonLabel: openDialogOptions.buttonLabel || 'Select',
        properties: Array.from(propsSet)
    };
    return (dispatch: Dispatch) => {
        const handleClose = (result: OpenDialogResult) => {
            dispatch(closeDirectorySelectDialog(result));
            onClose(!result.canceled && result.filePaths && result.filePaths.length > 0 ? result.filePaths[0] : null);
        };
        dispatch(openDirectorySelectDialog(openDialogOptions, handleClose));
        desktopActions.showFileOpenDialog(openDialogOptions, handleClose);
    };
}

export const OPEN_FILE_OPEN_DIALOG = 'OPEN_FILE_OPEN_DIALOG';
export const CLOSE_FILE_OPEN_DIALOG = 'CLOSE_FILE_OPEN_DIALOG';

function openFileOpenDialog(options: OpenDialogOptions,
                            onClose: (result: OpenDialogResult) => any): Action {
    return {type: OPEN_FILE_OPEN_DIALOG, payload: {options, onClose}};
}

function closeFileOpenDialog(result: OpenDialogResult): Action {
    return {type: CLOSE_FILE_OPEN_DIALOG, payload: {result}};
}


/**
 * Shows a file open dialog.
 *
 * @param openDialogOptions the file-save dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param onClose a function which is called with the open dialog result
 * @returns a thunk action
 */
export function showFileOpenDialog(openDialogOptions: OpenDialogOptions,
                                   onClose: (result: OpenDialogResult) => void): ThunkAction {
    return (dispatch: Dispatch) => {
        const handleClose = (result: OpenDialogResult) => {
            dispatch(closeFileOpenDialog(result));
            onClose(result);
        };
        dispatch(openFileOpenDialog(openDialogOptions, handleClose));
        desktopActions.showFileOpenDialog(openDialogOptions, handleClose);
    };
}

/**
 * Shows a single-file open dialog.
 * Similar to "showFileOpenDialog" but will always return a single path or null.
 *
 * @param openDialogOptions the file-open dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param onClose a function which is called with the selected file path or null if the dialog was canceled
 * @returns a thunk action
 */
export function showSingleFileOpenDialog(openDialogOptions: OpenDialogOptions,
                                         onClose: (filePath: string | null) => void): ThunkAction {
    const propsSet = new Set(openDialogOptions.properties);
    propsSet.delete('multiSelections')
    openDialogOptions = {...openDialogOptions, properties: Array.from(propsSet)};
    return showFileOpenDialog(openDialogOptions,
        (result => {
            onClose(!result.canceled && result.filePaths.length > 0 ? result.filePaths[0] : null);
        }));
}

/**
 * Shows a multi-file open dialog.
 * Similar to "showFileOpenDialog" but will always return a single path or null.
 *
 * @param openDialogOptions the file-open dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param onClose a function which is called with the selected file paths
 * @returns a thunk action
 */
export function showMultiFileOpenDialog(openDialogOptions: OpenDialogOptions,
                                        onClose: (filePaths: string[]) => any): ThunkAction {
    const propsSet = new Set(openDialogOptions.properties);
    propsSet.add('multiSelections')
    openDialogOptions = {...openDialogOptions, properties: Array.from(propsSet)};
    return showFileOpenDialog(openDialogOptions,
        (result => {
            onClose(!result.canceled ? result.filePaths : []);
        }));
}

export const OPEN_FILE_SAVE_DIALOG = 'OPEN_FILE_SAVE_DIALOG';
export const CLOSE_FILE_SAVE_DIALOG = 'CLOSE_FILE_SAVE_DIALOG';

function openFileSaveDialog(options: SaveDialogOptions,
                            onClose: (result: SaveDialogResult) => any): Action {
    return {type: OPEN_FILE_SAVE_DIALOG, payload: {options, onClose}};
}

function closeFileSaveDialog(result: SaveDialogResult): Action {
    return {type: CLOSE_FILE_SAVE_DIALOG, payload: {result}};
}

/**
 * Shows a file save dialog.
 *
 * @param saveDialogOptions the file-save dialog options, see https://github.com/electron/electron/blob/master/docs/api/dialog.md
 * @param onClose a function which is called with the selected file path
 * @returns a thunk action
 */
export function showFileSaveDialog(saveDialogOptions: SaveDialogOptions,
                                   onClose: (result: SaveDialogResult) => any): ThunkAction {
    return (dispatch: Dispatch) => {
        const handleClose = (result: SaveDialogResult) => {
            dispatch(closeFileSaveDialog(result));
            onClose(result);
        };
        dispatch(openFileSaveDialog(saveDialogOptions, handleClose));
        desktopActions.showFileSaveDialog(saveDialogOptions, handleClose);
    };
}

export const OPEN_MESSAGE_BOX = 'OPEN_MESSAGE_BOX';
export const CLOSE_MESSAGE_BOX = 'CLOSE_MESSAGE_BOX';


/**
 * Bring up File upload/download dialogs
 */

export function fileUploadInteractive() {
    return showDialog('fileUploadDialog');
}


/**
 *
 * @param file file to upload
 */

export function uploadFiles(file: File): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const webAPIServiceURL = state.communication.webAPIServiceURL;

        selectors.fileAPISelector(state).uploadFiles(file, webAPIServiceURL)
            .then((res) => {
                showToast({type: res.status, text: 'Upload finished: ' + res.message});
            })
            .catch((error) => {
                showToast({type: 'error', text: error.toString()});
                console.error(error);
            });
    }
}

/**
 *
 * @param files File that will be downloaded
 */
export function downloadFiles(files: File[]): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const webAPIServiceURL = state.communication.webAPIServiceURL;

        selectors.fileAPISelector(state).downloadFiles(files, webAPIServiceURL)
            .then(() => {
                showToast({type: 'info', text: 'Download finished.'});
            })
            .catch((error) => {
                showToast({type: 'error', text: error.toString()});
                console.error(error);
            });
    }
}


function openMessageBox(options: MessageBoxOptions,
                        onClose: (result: MessageBoxResult | null) => void): Action {
    return {type: OPEN_MESSAGE_BOX, payload: {options, onClose}};
}

function closeMessageBox(result: MessageBoxResult | null): Action {
    return {type: CLOSE_MESSAGE_BOX, payload: {result}};
}

export function showMessageBox(messageBoxOptions: MessageBoxOptions,
                               onClose?: (result: MessageBoxResult | null) => void): ThunkAction {
    return (dispatch: Dispatch) => {
        const handleClose = (result: MessageBoxResult | null) => {
            dispatch(closeMessageBox(result));
            if (onClose) {
                onClose(result);
            }
        };
        dispatch(openMessageBox(messageBoxOptions, handleClose));
        desktopActions.showMessageBox(messageBoxOptions, handleClose);
    };
}


//noinspection JSUnusedGlobalSymbols
/**
 * Show the given file in a file manager. If possible, select the file.
 * @param fullPath
 */
export function showItemInFolder(fullPath: string): boolean {
    if (hasElectron('showItemInFolder')) {
        return electron.shell.showItemInFolder(fullPath);
    }
    return false;
}

/**
 * Open the given file in the desktop's default manner.
 * @param fullPath
 */
export function openItem(fullPath: string): boolean {
    if (hasElectron('openItem')) {
        return electron.shell.openItem(fullPath);
    }
    return false;
}

/**
 * Open the given URL in the desktop's default manner.
 *
 * @param url The URL.
 * @returns {boolean}
 */
export function openExternal(url: string): boolean {
    if (hasElectron('openExternal')) {
        return electron.shell.openExternal(url);
    }
    return false;
}


/**
 * Copies given text to clipboard.
 * @param text The text to be copied.
 */
export function copyTextToClipboard(text: string) {
    if (hasElectron('copyTextToClipboard')) {
        // noinspection JSIgnoredPromiseFromCall
        electron.clipboard.writeText(text);
    } else {
        copyToClipboard(text);
    }
}

/**
 * Update frontend preferences (but not backend configuration).
 *
 * @param callback an optional function which is called with the selected button index
 * @returns the selected button index or null, if no button was selected or the callback function is defined
 */
export function sendPreferencesToMain(callback?: (error: any) => void): ThunkAction {
    return (dispatch: Dispatch, getState: GetState) => {
        if (!hasElectron('sendPreferencesToMain')) {
            return;
        }
        const session = getState().session;
        const preferences = Object.assign({}, session);
        const excludedPreferenceNames = [
            'backendConfig',           // treated differently, see storeBackendConfig
            'mainWindowBounds',        // use current value from main process
            'devToolsOpened',          // use current value from main process
            'suppressQuitConfirm',     // use current value from main process
        ];
        excludedPreferenceNames.forEach(propertyName => {
            if (preferences.hasOwnProperty(propertyName)) {
                delete preferences[propertyName];
            }
        });
        const actionName = 'set-preferences';
        electron.ipcRenderer.send(actionName, preferences);
        if (callback) {
            electron.ipcRenderer.once(actionName + '-reply', (event, error: any) => {
                callback(error);
            });
        }
    };
}

function hasElectron(functionName: string): boolean {
    if (!electron) {
        console.warn(`${functionName}() cannot be executed, module electron not available`);
        return false;
    } else if (!electron.ipcRenderer) {
        console.warn(`${functionName}() cannot be executed, module electron.ipcRenderer not available`);
        return false;
    }
    return true;
}


function handleFetchError(error: any, message: string) {
    console.info('fetch error: ', message, error);
    let suffix = '';
    if (error instanceof HttpError) {
        if (error.statusText) {
            suffix = ` (HTTP status ${error.status}: ${error.statusText})`;
        } else {
            suffix = `(HTTP status ${error.status})`;
        }
    } else if (error instanceof TypeError) {
        suffix = ' (wrong URL or no internet)';
    } else if (error instanceof Error && error.message) {
        suffix = ` (${error.message})`;
    }
    showToast({type: 'error', text: message + suffix});
}

function invokeUntil(callback: () => Promise<any>,
                     condition: (result: any) => boolean,
                     onSuccess: (result: any) => any,
                     onError: (error: any) => any,
                     interval: number,
                     timeout: number) {
    let startTime = new Date().getTime();
    let func: () => void;
    // Uncomment for debugging
    // let attempt = 0;
    let error: any = null;
    const _func = async () => {
        // attempt++;
        let result;
        try {
            // console.log('attempt:', attempt);
            result = await callback();
        } catch (e) {
            error = e;
        }
        if (condition(result)) {
            onSuccess(result);
        } else if ((new Date().getTime() - startTime) > timeout) {
            onError(error || new Error('Timeout'));
        } else {
            setTimeout(func, interval);
        }
    };

    setTimeout(_func, interval);
}

