// IMPORTANT: Any changes of CATE_APP_VERSION must be synchronized with
// 1. with the version field in "../package.json".
// 2. with CATE_PWA_VERSION in "./serviceWorker.ts"
//
export const CATE_APP_VERSION = "3.1.4-dev0";

const DEFAULT_API_ENDPOINT_DEV = 'https://dev.catehub.brockmann-consult.de/api/v2/';
const DEFAULT_API_ENDPOINT_PRODUCTION = 'https://catehub.climate.esa.int/api/v2';
const DEFAULT_API_ENDPOINT_STAGE = 'https://stage.catehub.climate.esa.int/api/v2';

const MANAG_API_PATH = '/users/{username}/webapis';
const CLOSE_API_PATH = '/users/{username}/webapis';
const COUNT_API_PATH = '/webapis';

const DEFAULT_MAX_NUM_USERS = 50;

const DEFAULT_AUTH_URL = "https://192-171-169-159.sslip.io/auth";
const DEFAULT_AUTH_REALM = "cate";
const DEFAULT_AUTH_CLIENT_ID = "cate-webui";


export interface AuthConfig {
    url: string;
    realm: string;
    clientId: string;
}

export interface WebApiConfig {
    endpointUrl: string;
    managApiUrl: string;
    closeApiUrl: string;
    countApiUrl: string;
    maxNumUsers: number;
}

export interface Config {
    version: string;
    auth: AuthConfig;
    webApi: WebApiConfig;
}

const ENDPOINT_URL = getEndpointUrl();

export const CONFIG: Config = {
    version: CATE_APP_VERSION,
    auth: {
        url: process.env.REACT_APP_KEYCLOAK_URL || DEFAULT_AUTH_URL,
        realm: process.env.REACT_APP_KEYCLOAK_REALM || DEFAULT_AUTH_REALM,
        clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || DEFAULT_AUTH_CLIENT_ID,
    },
    webApi: {
        endpointUrl: ENDPOINT_URL,
        managApiUrl: ENDPOINT_URL + MANAG_API_PATH,
        closeApiUrl: ENDPOINT_URL + CLOSE_API_PATH,
        countApiUrl: ENDPOINT_URL + COUNT_API_PATH,
        maxNumUsers: getMaxNumUsers(),
    }
};

console.debug('CONFIG:', CONFIG);


function getEndpointUrl(): string {
    let url = process.env.REACT_APP_CATEHUB_ENDPOINT;
    if (!url) {
        if (window.location.host.indexOf('stage') >= 0) {
            url = DEFAULT_API_ENDPOINT_STAGE;
        } else if (window.location.host.indexOf('dev') >= 0) {
            url = DEFAULT_API_ENDPOINT_DEV;
        } else {
            url = DEFAULT_API_ENDPOINT_PRODUCTION;
        }
    }
    return url.endsWith('/') ? url.substr(0, url.length - 1) : url;
}

function getMaxNumUsers(): number {
    return process.env.REACT_APP_MAX_NUM_USERS
           ? parseInt(process.env.REACT_APP_MAX_NUM_USERS)
           : DEFAULT_MAX_NUM_USERS;
}

