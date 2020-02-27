import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { applyMiddleware, createStore, Dispatch, Middleware, Store } from 'redux';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import ApplicationPage from './containers/ApplicationPage'
import { State } from './state';
import * as actions from './actions'
import { stateReducer } from './reducers';

let electron;
try {
    electron = require('electron');
} catch (error) {
    electron = null;
}

export function main() {
    const middlewares: Middleware[] = [thunkMiddleware];

    if (process.env.NODE_ENV === 'development') {
        const nonLoggedActionTypes = new Set([
                                                 // Too much noise:
                                                 actions.SET_GLOBE_MOUSE_POSITION,
                                                 actions.SET_GLOBE_VIEW_POSITION,
                                                 actions.SET_GLOBE_VIEW_POSITION,
                                                 actions.UPDATE_MOUSE_IDLE_STATE,
                                                 actions.UPDATE_SESSION_STATE,
                                                 actions.SET_USER_CREDENTIALS,
                                             ]);
        const loggerOptions = {
            level: 'info',
            collapsed: true,
            diff: true,
            predicate: (getState, action) => !nonLoggedActionTypes.has(action.type)
        };
        middlewares.push(createLogger(loggerOptions));
    }

    const middleware = applyMiddleware(...middlewares);
    const store = createStore(stateReducer, middleware) as Store<State>;

    ReactDOM.render(
        <Provider store={store}>
            <ApplicationPage/>
        </Provider>,
        document.getElementById('root')
    );

    if (electron && electron.ipcRenderer) {
        const ipcRenderer = electron.ipcRenderer;

        ipcRenderer.on('update-initial-state', (event, initialState) => {
            store.dispatch(actions.updateInitialState(initialState));
        });

        ipcRenderer.on('new-workspace', () => {
            store.dispatch(actions.newWorkspaceInteractive() as any);
        });

        ipcRenderer.on('open-workspace', () => {
            store.dispatch(actions.openWorkspaceInteractive() as any);
        });

        ipcRenderer.on('close-workspace', () => {
            store.dispatch(actions.closeWorkspaceInteractive() as any);
        });

        ipcRenderer.on('save-workspace', () => {
            store.dispatch(actions.saveWorkspaceInteractive() as any);
        });

        ipcRenderer.on('save-workspace-as', () => {
            store.dispatch(actions.saveWorkspaceAsInteractive());
        });

        ipcRenderer.on('delete-workspace', () => {
            store.dispatch(actions.deleteWorkspaceInteractive() as any);
        });

        ipcRenderer.on('show-preferences-dialog', () => {
            store.dispatch(actions.showPreferencesDialog());
        });

        ipcRenderer.on('get-preferences', () => {
            store.dispatch(actions.sendPreferencesToMain() as any);
        });

        ipcRenderer.on('logout', () => {
            store.dispatch(actions.logout() as any);
        });
    }

    document.addEventListener('drop', function (event: any) {
        event.preventDefault();
        event.stopPropagation();
        for (let file of event.dataTransfer.files) {
            readDroppedFile(file, store.dispatch);
        }
    });

    document.addEventListener('dragover', function (event: any) {
        event.preventDefault();
        event.stopPropagation();
    });
}

function readDroppedFile(file: File, dispatch: Dispatch<State>) {
    let opName, opArgs;
    if (file.name.endsWith('.nc')) {
        opName = 'read_netcdf';
        // opArgs = {file: {value: file.path}, normalize: {value: false}}
    } else if (file.name.endsWith('.txt')) {
        opName = 'read_text';
    } else if (file.name.endsWith('.json')) {
        opName = 'read_json';
    } else if (file.name.endsWith('.csv')) {
        opName = 'read_csv';
    } else if (file.name.endsWith('.geojson') || file.name.endsWith('.shp') || file.name.endsWith('.gml')) {
        opName = 'read_geo_data_frame';
    }
    if (!opArgs) {
        opArgs = {file: {value: file.name}};
    }
    if (opName) {
        dispatch(actions.setWorkspaceResource(opName,
                                              opArgs,
                                              null,
                                              false,
                                              `Reading dropped file ${file.name}`) as any);
    } else {
        console.warn('Dropped file of unrecognized type: ', file.name);
    }
}
