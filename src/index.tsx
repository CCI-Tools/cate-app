import { main } from './renderer/main';

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

main();
