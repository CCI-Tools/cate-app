import { callBlobApi, callJsonApi } from "./callHttpApi";
import { WebAPIClient } from "../WebAPIClient";

interface ResponseStatus {
    status: 'info' | 'success' | 'notification' | 'warning' | 'error';
    message?: string;
}


export class FilesAPI {
    private readonly webAPIClient: WebAPIClient;

    constructor(webAPIClient: WebAPIClient) {
        this.webAPIClient = webAPIClient;
    }

    uploadFiles(dir: string, file: File, serviceUrl: string) {
        let formData = new FormData();

        formData.append('dir', dir);
        formData.append('files', file, file.name);

        return callJsonApi<ResponseStatus>(serviceUrl + '/files/upload',
            undefined,
            {
                mode: 'cors',
                method: 'POST',
                body: formData,
            });
    }

    downloadFiles(filePath: string, serviceUrl: string) {
        const target_dir = {'target_dir': filePath}

        return callBlobApi(serviceUrl + '/files/download',
            undefined,
            {
                mode: 'cors',
                method: 'POST',
                body: JSON.stringify(target_dir)
            });
    }
}
