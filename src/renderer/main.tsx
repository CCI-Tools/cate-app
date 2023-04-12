import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider as StoreProvider } from 'react-redux';
import { applyMiddleware, createStore, Middleware, Store } from 'redux';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';

import * as actions from './actions'
import { stateReducer } from './reducers';
import { State } from './state';
import AppMainPageWrapper from './containers/AppMainPageWrapper';
import { connectWebAPIService } from './actions';
import { DEFAULT_SERVICE_URL } from './initial-state';


function getServiceUrl() {
    let serviceUrl: string = DEFAULT_SERVICE_URL;
    const search = new URLSearchParams(window.location.search);
    if (search.has('serviceUrl')) {
        serviceUrl = search.get('serviceUrl');
    } else {
        const origin = window.location.origin;
        const path = window.location.pathname;
        if (path.endsWith('/app')) {
            serviceUrl = origin + path.substring(0, path.length - 4);
        } else if (path.endsWith('/app/')) {
            serviceUrl = origin + path.substring(0, path.length - 5);
        }
    }
    return serviceUrl;
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
    store.dispatch(connectWebAPIService(getServiceUrl()) as any);

    ReactDOM.render(
        (
          <StoreProvider store={store}>
              <AppMainPageWrapper/>
          </StoreProvider>
        ),
        document.getElementById('root')
    );
}
