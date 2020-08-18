import { callBlobApi, callJsonApi } from "./callHttpApi";
import { WebAPIClient } from "../WebAPIClient";
import { JobProgress, JobPromise } from "../Job";


interface ResponseStatus {
    status: 'info' | 'success' | 'notification' | 'warning' | 'error';
    message?: string;
}


export interface ProcessState {
    process_id: string;
}

export class FilesAPI {
    private readonly webAPIClient: WebAPIClient;

    constructor(webAPIClient: WebAPIClient) {
        this.webAPIClient = webAPIClient;
    }

    monitorProcess(processId: string,
                   onProgress: (progress: JobProgress) => void): JobPromise<void> {
        return this.webAPIClient.call('monitor_download_files',
                                      [processId],
                                      onProgress,
                                      () => {
                                      });
    }

    registerProcess(serviceUrl: string) {
        return callJsonApi<ProcessState>(
            serviceUrl + '/files/download',
            undefined,
            {
                mode: 'cors',
                method: 'PUT',
                body: JSON.stringify({}),
            });
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

    downloadFiles(filePaths: string[], processId: string, serviceUrl: string) {
        const target_files = {'target_files': filePaths, 'process_id': processId};

        return callBlobApi(serviceUrl + '/files/download',
                           undefined,
                           {
                               mode: 'cors',
                               method: 'POST',
                               body: JSON.stringify(target_files)
                           }
        );
    }
}
