import { HttpError } from '../HttpError';


function getEndpointUrl(): string {
    let endpointUrl;
    if (process.env.REACT_APP_CATEHUB_ENDPOINT) {
        endpointUrl = process.env.REACT_APP_CATEHUB_ENDPOINT;
    } else if (window.location.host.indexOf('stage') >= 0) {
        endpointUrl = 'https://stage.catehub.brockmann-consult.de';
    } else {
        endpointUrl = 'https://catehub.brockmann-consult.de';
    }
    return new URL(endpointUrl).href;
}

const API_ENDPOINT = getEndpointUrl();

const WEBAPI_MANAG_PATH = process.env.REACT_APP_CATEHUB_WEBAPI_MANAG_PATH || '/user/{username}/webapi';
const WEBAPI_CLOSE_PATH = process.env.REACT_APP_CATEHUB_WEBAPI_CLOSE_PATH || '/user/{username}/webapi/shutdown';
const WEBAPI_COUNT_PATH = process.env.REACT_APP_CATEHUB_WEBAPI_COUNT_PATH || '/webapi/count';

const WEBAPI_MANAG_API_URL = new URL(`${API_ENDPOINT}${WEBAPI_MANAG_PATH}`).href;
const WEBAPI_CLOSE_API_URL = new URL(`${API_ENDPOINT}${WEBAPI_CLOSE_PATH}`).href;
const WEBAPI_COUNT_API_URL = new URL(`${API_ENDPOINT}${WEBAPI_COUNT_PATH}`).href;

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
