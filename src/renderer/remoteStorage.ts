import { SessionState } from "./state";
import { JobPromise, WebAPIClient } from "./webapi";


/**
 * This interface provides access to a particular domain's session or local storage.
 * It allows, for example, the addition, modification, or deletion of stored data items.
 */
export class RemoteStorage {
    private readonly webAPIClient: WebAPIClient;

    constructor(webAPIClient: WebAPIClient) {
        this.webAPIClient = webAPIClient;
    }

    getPreferences(): JobPromise<SessionState> {
        return this.webAPIClient.call('get_preferences', []);
    }

    setPreferences(session: Partial<SessionState>): JobPromise<Partial<SessionState>> {
        return this.webAPIClient.call('set_preferences', [session]);
    }
}
