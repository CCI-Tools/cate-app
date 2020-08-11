import { WebAPIClient } from '../WebAPIClient';
import { JobPromise } from '../Job';
import { FileNode } from '../../components/desktop/fs/FileNode';


export class FileSystemAPI {
    private webAPIClient: WebAPIClient;

    constructor(webAPI: WebAPIClient) {
        this.webAPIClient = webAPI;
    }

    updateFileNode(path: string): JobPromise<FileNode> {
        return this.webAPIClient.call<FileNode>('update_file_node', [path]);
    }
}
