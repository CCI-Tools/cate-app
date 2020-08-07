import { WebAPIClient } from '../WebAPIClient';
import { JobPromise } from '../Job';
import { FileNode } from '../../components/desktop/fs/file-system';


export class FileSystemAPI {
    private webAPIClient: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPIClient = webAPI;
    }

    updateFileNode(dirPath?: string): JobPromise<FileNode> {
        return this.webAPIClient.call<FileNode>('update_file_node', [dirPath || null]);
    }
}
