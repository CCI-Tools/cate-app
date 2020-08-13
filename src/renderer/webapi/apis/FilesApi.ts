import { callBlobApi, callJsonApi } from "./callHttpApi";
import { WebAPIClient } from "../WebAPIClient";
import * as path from "path";
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

    downloadFiles(filePath: string, processId: string, serviceUrl: string) {
        const target_dir = {'target_dir': filePath, 'process_id': processId};
        const zip_file_name = path.basename(filePath);

        return callBlobApi(serviceUrl + '/files/download',
                           undefined,
                           {
                               mode: 'cors',
                               method: 'POST',
                               body: JSON.stringify(target_dir)
                           },
                           zip_file_name + '.zip');
    }
}
