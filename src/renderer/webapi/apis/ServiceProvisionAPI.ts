import { HttpError } from '../HttpError';
import { CONFIG } from '../../../config';

export interface Condition {
    type: string;
    status: string;
    reason: string | null;
    message: string | null;
    last_probe_time: string | null;
    last_transition_time: string;
}

export interface ContainerStateValue {
    container_id?: string;
    exit_code?: number;
    finished_at?: string;
    message?: string | null;
    reason?: string;
    signal?: string | null;
    started_at?: string;
}

export interface ContainerState {
    running: ContainerStateValue | null;
    terminated: ContainerStateValue | null;
    waiting: ContainerStateValue | null;
}

export interface ContainerStatus {
    name: string;
    ready: string;
    restart_count: number;
    started: boolean;
    image: string;
    image_id: string;
    container_id: string;
    state: ContainerState;
    last_state: ContainerState;
}

export interface PodStatus {
    phase: string;
    host_ip?: string;
    start_time?: string;
    message?: string | null;
    nominated_node_name?: string | null;
    pod_ip?: string;
    qos_class?: string;
    reason?: string | null;
    pod_i_ps?: Array<{ ip: string }>;

    conditions?: Condition[];
    container_statuses?: ContainerStatus[];
    init_container_statuses?: null | ContainerStatus[];
    ephemeral_container_statuses?: null | ContainerStatus[];
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
     * Get status of the user's webapi (RUNNING, PENDING, FAILED, ...).
     * See https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
     */
    async getPodStatus(username: string, token?: string): Promise<PodStatus> {
        return await this.performServiceOp<PodStatus>(CONFIG.webApi.managApiUrl,
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

