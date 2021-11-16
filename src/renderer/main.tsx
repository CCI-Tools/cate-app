import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider as StoreProvider } from 'react-redux';
import { applyMiddleware, createStore, Middleware, Store } from 'redux';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import Keycloak, { KeycloakInitOptions, KeycloakConfig } from 'keycloak-js'
import { KeycloakProvider } from '@react-keycloak/web'

import * as actions from './actions'
import AppRouter from './containers/AppRouter';
import { stateReducer } from './reducers';
import { State } from './state';
import { isElectron } from './electron';
import { CONFIG } from '../config';


const keycloak = Keycloak(getKeycloakConfig());

const keycloakProviderInitConfig: KeycloakInitOptions = {
    onLoad: 'check-sso',
    enableLogging: true,
};

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

    const onKeycloakEvent = (event, error) => {
        console.debug('onKeycloakEvent', event, error);
    }

    const onKeycloakTokens = (tokens) => {
        console.debug('onKeycloakTokens', tokens);
    }

    // Fetch hub status from GitHub
    const deployment = CONFIG.webApi.endpointUrl.includes('stage') || CONFIG.webApi.endpointUrl.includes('dev') ? 'development' : 'production';
    fetch(`https://raw.githubusercontent.com/CCI-Tools/cate-status/main/${deployment}.json`,
          {mode: 'cors'})
        .then(response =>
                  response.json())
        .then(hubStatus =>
                  store.dispatch(actions.updateHubStatus(
                      {...hubStatus, deployment})))
        .catch(e => console.error(e));

    ReactDOM.render(
        (
            <KeycloakProvider
                keycloak={keycloak}
                initConfig={keycloakProviderInitConfig}
                onEvent={onKeycloakEvent}
                onTokens={onKeycloakTokens}
            >
                <StoreProvider store={store}>
                    <AppRouter/>
                </StoreProvider>
            </KeycloakProvider>
        ),
        document.getElementById('root')
    );

    if (!isElectron()) {
        //
        // Desktop-PWA app install, see https://web.dev/customize-install/
        //
        window.addEventListener('beforeinstallprompt', (event: Event) => {
            // Update UI notify the user they can install the PWA
            store.dispatch(actions.showPwaInstallPromotion(event));
            console.log('BEFORE INSTALL PROMPT:', event);
        });
    }
}

function getKeycloakConfig(): KeycloakConfig {
    const {url, realm, clientId} = CONFIG.auth;
    if (!realm || !url || !clientId) {
        throw new Error('Missing or incomplete KeyCloak configuration');
    }
    return {realm, url, clientId};
}
