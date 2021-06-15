import { HttpError } from '../HttpError';
import { CONFIG } from '../../../config';


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

/**
 * Represents the cate-hub API.
 */
export class ServiceProvisionAPI {

    /**
     * Get status of the user's webapi (RUNNING, PENDING, FAILED, ...
     * See https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
     */
    async getServiceStatus(username: string, token: string): Promise<ServiceStatus> {
        return await this.performServiceOp<ServiceStatus>(CONFIG.webApi.managApiUrl,
                                                          'GET', username, token);
    }

    async startService(username: string, token: string): Promise<string> {
        const result = await this.performServiceOp<StartResult>(CONFIG.webApi.managApiUrl,
                                                                'POST', username, token);
        return result.serverUrl;
    }

    async stopServiceInstance(username: string): Promise<boolean> {
        return await this.performServiceOp<boolean>(CONFIG.webApi.closeApiUrl,
                                                    'DELETE', username);
    }

    async getServiceCount(): Promise<number> {
        const result = await this.performServiceOp<CountResult>(CONFIG.webApi.countApiUrl,
                                                                'GET');
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
        return response.json();
    }
}

