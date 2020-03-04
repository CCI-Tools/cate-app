import { HttpError } from '../HttpError';
import { WebAPIConfig } from '../../state';

const CATE_HUB_SERVER_BASE = 'https://catehub.192.171.139.57.nip.io';
const CATE_HUB_USER_WEBAPI_URL = CATE_HUB_SERVER_BASE + '/user/{username}';
const CATE_HUB_TOKEN_URL = CATE_HUB_SERVER_BASE + '/hub/api/authorizations/token';
const CATE_HUB_USER_SERVER_URL = CATE_HUB_SERVER_BASE + '/hub/api/users/{username}/server';
const CATE_HUB_USER_URL = CATE_HUB_SERVER_BASE + '/hub/api/users/{username}';

export interface AuthInfo {
    token: string;
    user: User;
    warning?: string;
}

export interface User {
    kind: string;
    name: string;
    admin: boolean;
    groups: string[];
    server: string | null;
    pending: string | null;
    created: string;
    last_activity: string;
    servers: any | null;
    auth_state?: any;
}

export class AuthAPI {
    // noinspection JSMethodCanBeStatic
    getWebAPIConfig(username: string): WebAPIConfig {
        return {
            serviceURL: new URL(CATE_HUB_USER_WEBAPI_URL.replace('{username}', username)).toString(),
        };
    }

    auth(username: string, password: string): Promise<AuthInfo> {
        const url = new URL(CATE_HUB_TOKEN_URL);
        console.log('POST: ', url);
        return fetch(url.toString(), {
            mode: 'cors',
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password}),
        }).then((response: Response) => {
            if (!response.ok) {
                throw HttpError.fromResponse(response);
            }
            return response.json() as Promise<AuthInfo>;
        });
    }

    getUser(username: string, token: string): Promise<User | null> {
        const url = new URL(CATE_HUB_USER_URL.replace('{username}', username));
        console.log('GET: ', url);
        return fetch(url.toString(), {
            method: 'get',
            headers: {
                'Authorization': `token ${token}`,
            }
        }).then((response: Response) => {
            if (!response.ok) {
                console.log(response);
                return null;
            }
            return response.json() as Promise<User>;
        });
    }

    startWebAPI(username: string, token: string): Promise<boolean> {
        const url = new URL(CATE_HUB_USER_SERVER_URL.replace('{username}', username)).toString();
        console.log('POST: ', url);
        return fetch(url.toString(), {
            method: 'post',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
            },
            body: '{"profile" : "Cate Web-API Service"}',
        }).then((response: Response) => {
            if (!response.ok) {
                throw HttpError.fromResponse(response);
            }
            return true;
        });
    }

    stopWebAPI(username: string, token: string): Promise<boolean> {
        const url = new URL(CATE_HUB_USER_SERVER_URL.replace('{username}', username)).toString();
        console.log('DELETE: ', url);
        return fetch(url.toString(), {
            method: 'delete',
            headers: {
                'Authorization': `token ${token}`,
            },
        }).then((response: Response) => {
            if (!response.ok) {
                throw HttpError.fromResponse(response);
            }
            return true;
        });
    }
}
