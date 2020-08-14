import { WebAPIServiceInfo } from '../../state';
import { HttpError } from '../HttpError';


export class ServiceInfoAPI {

    getServiceInfo(serviceURL: string): Promise<WebAPIServiceInfo> {
        const url = new URL(serviceURL + "/");
        // console.log('GET: ', url);
        return fetch(url.toString())
            .then((response: Response) => {
                if (!response.ok) {
                    throw HttpError.fromResponse(response);
                }
                return response.json() as Promise<any>;
            })
            .then((resonse: any) => {
                const webAPIServiceInfo = resonse.content;
                return {
                    name: webAPIServiceInfo.name,
                    version: webAPIServiceInfo.version,
                    timestamp: webAPIServiceInfo.timestamp,
                    userRootMode: webAPIServiceInfo.user_root_mode,
                    hostOS: webAPIServiceInfo.host_os
                };
            });
    }
}
