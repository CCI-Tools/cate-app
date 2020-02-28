import { main } from './renderer/main';
import * as serviceWorker from './serviceWorker';

import 'normalize.css/normalize.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/table/lib/css/table.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import './index.css';

interface Window {
    CESIUM_BASE_URL: string;
}

declare var window: Window;
window.CESIUM_BASE_URL = './cesium';
console.log('CESIUM_BASE_URL =', window.CESIUM_BASE_URL);

main();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
