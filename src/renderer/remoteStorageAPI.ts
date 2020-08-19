import { SessionState } from "./state";
import { JobPromise, WebAPIClient } from "./webapi";


/**
 * This interface provides access to a particular domain's session or local storage.
 * It allows, for example, the addition, modification, or deletion of stored data items.
 */
export class RemoteStorageAPI {
    private readonly webAPIClient: WebAPIClient;

    constructor(webAPIClient: WebAPIClient) {
        this.webAPIClient = webAPIClient;
    }

    loadPreferences(): JobPromise<Partial<SessionState>> {
        return this.webAPIClient.call('get_preferences', []);
    }

    updatePreferences(session: Partial<SessionState>): JobPromise<Partial<SessionState>> {
        return this.webAPIClient.call('set_preferences', [session]);
    }
}
