import { main } from './renderer/main';
import { showToast } from './renderer/toast'
import * as serviceWorker from './serviceWorker';

import 'normalize.css/normalize.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/table/lib/css/table.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/select/lib/css/blueprint-select.css';
import './renderer/resources/fonts/stylesheet.css';
import './index.css';

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        CESIUM_BASE_URL?: string;
    }
}

window.CESIUM_BASE_URL = './cesium';
// console.debug('CESIUM_BASE_URL =', window.CESIUM_BASE_URL);

main();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register(
    {
        onSuccess: () => {
            showToast({
                          type: 'notification',
                          text: 'App is cached for offline use.'
                      });
        },
        onUpdate: () => {
            showToast({
                          type: 'notification',
                          text: 'New app version available. ' +
                                'It will be used when all tabs for this page are closed.'
                      });
        },
        onError: (error: Error) => {
            showToast({
                          type: 'error',
                          text: 'Error during service worker registration: ' +
                                error.message
                      });
        },
    }
);
