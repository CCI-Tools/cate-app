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

    uploadFiles(file: File, serviceUrl: string) {
        let formData = new FormData();

        // formData.append('targetdir', 'helge');
        formData.append('files', file, file.name);

        return callJsonApi<ResponseStatus>(serviceUrl + '/files/upload',
            undefined,
            {
                mode: 'no-cors',
                method: 'POST',
                body: formData,
            });
    }

    downloadFiles(files: File[], serviceUrl: string) {
        const file_names = {'filenames': ['helge/java_error_in_IDEA_19501.log', 'helge/ESACCI-OC-L3S-CHLOR_A-MERGED-8D_DAILY_4km_SIN_PML_OCx-19971227-fv3.1.nc']}

        return callBlobApi(serviceUrl + '/files/download',
            undefined,
            {
                mode: 'cors',
                method: 'POST',
                body: JSON.stringify(file_names)
            });
    }
}
