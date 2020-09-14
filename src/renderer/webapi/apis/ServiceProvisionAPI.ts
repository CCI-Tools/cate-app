import { KeycloakInstance } from 'keycloak-js';

import { HttpError } from '../HttpError';


const API_ENDPOINT = process.env.REACT_APP_CATEHUB_ENDPOINT;
if (!API_ENDPOINT) {
    throw new Error('Missing REACT_APP_CATEHUB_ENDPOINT in .env');
}

const WEBAPI_MANAG_PATH = process.env.REACT_APP_CATEHUB_WEBAPI_MANAG_PATH || '/user/{username}/webapi';
const WEBAPI_COUNT_PATH = process.env.REACT_APP_CATEHUB_WEBAPI_COUNT_PATH || '/webapi/count';

const WEBAPI_MANAG_API_URL = `${API_ENDPOINT}/${WEBAPI_MANAG_PATH}`;
const WEBAPI_COUNT_API_URL = `${API_ENDPOINT}/${WEBAPI_COUNT_PATH}`;

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

export class ServiceProvisionAPI {
    private readonly keycloak: KeycloakInstance<'native'>;

    constructor(keycloak: KeycloakInstance<'native'>) {
        this.keycloak = keycloak;
    }

    /**
     * Get status of the user's webapi (RUNNING, PENDING, FAILED, ...
     * See https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
     */
    async getServiceStatus(): Promise<ServiceStatus> {
        return await this.performServiceOp<ServiceStatus>('GET');
    }

    async startService(): Promise<string> {
        const result =  await this.performServiceOp<StartResult>('POST');
        return result.serverUrl;
    }

    async stopServiceInstance(): Promise<boolean> {
        return await this.performServiceOp<boolean>('DELETE');
    }

    async getServiceCount(): Promise<number> {
        const response: Response = await fetch(WEBAPI_COUNT_API_URL, {
            method: 'GET',
            mode: 'cors'
        });
        if (!response.ok) {
            throw HttpError.fromResponse(response);
        }
        const jsonObject = await response.json();
        if (jsonObject.status !== 'ok') {
            throw new Error(jsonObject.message);
        }
        return jsonObject.result.running_pods as number;
    }

    private async performServiceOp<T>(method: 'GET' | 'POST' | 'DELETE'): Promise<T> {
        const profile = await this.keycloak.loadUserProfile();
        const username = profile.username;
        if (!username) {
            throw new Error('Authentication required, missing username.');
        }
        const token = this.keycloak.token;
        if (!token) {
            throw new Error('Authentication required, missing API token.');
        }
        const url = this.getServiceUrl(username);
        const response: Response = await fetch(url, {
            method,
            mode: 'cors',
            headers: this.getServiceHeaders(token),
        });
        if (!response.ok) {
            throw HttpError.fromResponse(response);
        }
        const jsonObject = await response.json();
        console.log(jsonObject);
        if (jsonObject.status !== 'ok') {
            throw new Error(jsonObject.message);
        }
        return jsonObject.result as T;
    }

    // noinspection JSMethodCanBeStatic
    private getServiceUrl(username: string) {
        return new URL(WEBAPI_MANAG_API_URL.replace('{username}', username)).toString();
    }

    // noinspection JSMethodCanBeStatic
    private getServiceHeaders(token: string): string[][] {
        return [
            ['Accept', `application/json`],
            ['Authorization', `Bearer ${token}`],
        ]
    }
}
