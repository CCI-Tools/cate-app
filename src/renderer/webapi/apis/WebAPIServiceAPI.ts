import { KeycloakInstance } from 'keycloak-js';

import { HttpError } from '../HttpError';


const WEBAPI_INST_API_URL = 'https://catehub-stage.brockmann-consult.de/user/{username}/webapi';
const WEBAPI_COUNT_API_URL = 'https://catehub-stage.brockmann-consult.de/webapi/count';

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

export class WebAPIServiceAPI {
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
        const response: Response = await fetch(WEBAPI_COUNT_API_URL);
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
        return new URL(WEBAPI_INST_API_URL.replace('{username}', username)).toString();
    }

    // noinspection JSMethodCanBeStatic
    private getServiceHeaders(token: string): string[][] {
        return [
            ['Authorization', `Bearer ${token}`],
        ]
    }
}
