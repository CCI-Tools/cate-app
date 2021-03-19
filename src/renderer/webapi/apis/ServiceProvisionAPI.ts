import { HttpError } from '../HttpError';

const DEFAULT_API_ENDPOINT_PRODUCTION = 'https://catehub.climate.esa.int';
const DEFAULT_API_ENDPOINT_STAGE = 'https://stage.catehub.climate.esa.int';

const WEBAPI_MANAG_API_URL = getOperationUrl('REACT_APP_CATEHUB_WEBAPI_MANAG_PATH',
                                             '/user/{username}/webapi');
const WEBAPI_CLOSE_API_URL = getOperationUrl('REACT_APP_CATEHUB_WEBAPI_CLOSE_PATH',
                                             '/user/{username}/webapi/shutdown');
const WEBAPI_COUNT_API_URL = getOperationUrl('REACT_APP_CATEHUB_WEBAPI_COUNT_PATH',
                                             '/webapi/count');

// console.debug('WEBAPI_MANAG_API_URL:', WEBAPI_MANAG_API_URL);
// console.debug('WEBAPI_CLOSE_API_URL:', WEBAPI_CLOSE_API_URL);
// console.debug('WEBAPI_COUNT_API_URL:', WEBAPI_COUNT_API_URL);

export interface ServiceStatus {
    host_ip: string;
    init_container_statuses?: string | null;
    message?: string | null;
    nominated_node_name?: string | null;
    phase: string;
    pod_ip: string;
    qos_class: string;
    reason?: string | null;
    start_time?: string;
}

interface StartResult {
    serverUrl: string;
}

interface CountResult {
    running_pods: number;
}

export class ServiceProvisionAPI {

    /**
     * Get status of the user's webapi (RUNNING, PENDING, FAILED, ...
     * See https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
     */
    async getServiceStatus(username: string, token: string): Promise<ServiceStatus> {
        return await this.performServiceOp<ServiceStatus>(WEBAPI_MANAG_API_URL, 'GET', username, token);
    }

    async startService(username: string, token: string): Promise<string> {
        const result = await this.performServiceOp<StartResult>(WEBAPI_MANAG_API_URL, 'POST', username, token);
        return result.serverUrl;
    }

    async stopServiceInstance(username: string): Promise<boolean> {
        return await this.performServiceOp<boolean>(WEBAPI_CLOSE_API_URL, 'DELETE', username);
    }

    async getServiceCount(): Promise<number> {
        const result = await this.performServiceOp<CountResult>(WEBAPI_COUNT_API_URL, 'GET');
        return result.running_pods as number;
    }

    // noinspection JSMethodCanBeStatic
    private async performServiceOp<T>(urlPattern: string,
                                      method: 'GET' | 'POST' | 'DELETE',
                                      username?: string,
                                      token?: string): Promise<T> {

        let headers = [['Accept', `application/json`]];
        if (token) {
            headers = [
                ...headers,
                ['Authorization', `Bearer ${token}`],
            ];
        }

        let url = urlPattern;
        if (urlPattern.indexOf('{username}') > 0) {
            url = new URL(urlPattern.replace('{username}', username)).toString()
        }

        const response: Response = await fetch(url, {method, headers, mode: 'cors'});
        if (!response.ok) {
            throw HttpError.fromResponse(response);
        }
        const jsonObject = await response.json();
        if (jsonObject.status !== 'ok') {
            throw new Error(jsonObject.message);
        }
        return jsonObject.result as T;
    }
}

export function getEndpointUrl(): string {
    if (process.env.REACT_APP_CATEHUB_ENDPOINT) {
        return process.env.REACT_APP_CATEHUB_ENDPOINT;
    } else if (window.location.host.indexOf('stage') >= 0) {
        return DEFAULT_API_ENDPOINT_STAGE;
    } else {
        return DEFAULT_API_ENDPOINT_PRODUCTION;
    }
}

function getOperationUrl(envVarName: string, defaultPath: string): string {
    const endpointUrl = getEndpointUrl();
    const path = process.env[envVarName] || defaultPath;
    if (endpointUrl.endsWith('/') && path.startsWith('/')) {
        return endpointUrl + path.substr(1);
    } else if (!endpointUrl.endsWith('/') && !path.startsWith('/')) {
        return endpointUrl + '/' + path;
    }
    return endpointUrl + path;
}
