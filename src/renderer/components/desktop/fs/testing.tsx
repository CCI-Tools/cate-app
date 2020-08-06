import { cloneFileNode, cloneFileNodes, FileNode, FileSystem, getBasename, getFileNode } from './file-system';

function x2(n: number, off?): string {
    const i = Math.round(Math.random() * n) + (off || 0);
    return i < 10 ? '0' + i : '' + i;
}

const newFileNode = (name, childNodes?: FileNode[]): FileNode => {
    return {
        name,
        lastModified: `2020-${x2(12, 1)}-${x2(30, 1)} ${x2(24)}:${x2(60)}:${x2(24)}`,
        size: Math.round(100000 * Math.random()),
        isDirectory: Boolean(childNodes),
        status: 'ready',
        childNodes,
    };
};

export const testData: FileNode[] = [
    newFileNode('Dir-1.zarr', [
        newFileNode('.zgroup'),
        newFileNode('.zattrs'),
        newFileNode('File-11'),
        newFileNode('File-12'),
        newFileNode('File-13'),
    ]),
    newFileNode('Dir-2', [
        newFileNode('Dir-21', [
            newFileNode('Dir-211', [
                newFileNode('File-2111.txt'),
                newFileNode('File-2112.txt'),
            ]),
            newFileNode('File-211.nc'),
            newFileNode('File-212.nc'),
            newFileNode('File-213.png'),
            newFileNode('File-214.geojson'),
        ]),
        newFileNode('Dir-22', [
            newFileNode('File-221.shp'),
            newFileNode('File-222.shp'),
            newFileNode('File-223.jpg'),
        ]),
        newFileNode('File-21.doc'),
        newFileNode('File-22.doc'),
        newFileNode('File-23.doc'),
    ]),
    newFileNode('Dir-3', [
        newFileNode('File-31.txt'),
        newFileNode('File-32.txt'),
        newFileNode('File-33.nc'),
        newFileNode('File-34.nc'),
        newFileNode('File-35.nc'),
        newFileNode('File-36.nc'),
    ]),
    newFileNode('Dir-4', []),
    newFileNode('File-1.txt'),
    newFileNode('File-2'),
    newFileNode('File-3.txt'),
];

class TestFileSystem implements FileSystem {
    private _rootNode: FileNode;

    constructor(rootNodes: FileNode[]) {
        this._rootNode = {
            name: '',
            lastModified: new Date(Date.now()).toLocaleString(),
            isDirectory: true,
            size: 0,
            status:'ready',
            childNodes: cloneFileNodes(rootNodes)
        };
    }

    getRootNode(): FileNode {
        return this._rootNode;
    }

    updateNode(dirPath?: string): Promise<FileNode> {
        this._rootNode = cloneFileNode(this._rootNode);
        return Promise.resolve(this._rootNode);
    }

    createDir(dirPath: string): Promise<FileNode> {
        const fileNode = getFileNode(this._rootNode, dirPath);
        if (!fileNode.isDirectory) {
            return Promise.reject(new Error(`${dirPath} not a directory`));
        }
        const newFileNode = {name: getBasename(dirPath), lastModified: '?', isDirectory: true, size: 0};
        fileNode.childNodes = [newFileNode, ...fileNode.childNodes];
        this._rootNode = cloneFileNode(this._rootNode);
        return Promise.resolve(this._rootNode);
    }

    deleteNodes(paths: string[]): Promise<FileNode> {
        throw new Error('not implemented')
    }
}

export const testFileSystem = new TestFileSystem(testData);