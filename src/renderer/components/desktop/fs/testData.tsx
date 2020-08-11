import { FileNode, FileNodeStatus } from './FileNode';

function x2(n: number, off?): string {
    const i = Math.round(Math.random() * n) + (off || 0);
    return i < 10 ? '0' + i : '' + i;
}

const newFileNode = (name, childNodes?: FileNode[], isDir?: boolean, status?: FileNodeStatus): FileNode => {
    return {
        name,
        lastModified: `2020-${x2(12, 1)}-${x2(30, 1)} ${x2(24)}:${x2(60)}:${x2(24)}`,
        size: Math.round(100000 * Math.random()),
        isDir: Boolean(isDir) || Boolean(childNodes),
        status: status,
        childNodes,
    };
};

export const testData = newFileNode('', [
    newFileNode('Dir-1.zarr', [
        newFileNode('.zgroup'),
        newFileNode('.zattrs'),
        newFileNode('var1', [
            newFileNode('.zarray'),
            newFileNode('.zattrs'),
            newFileNode('0'),
            newFileNode('1'),
            newFileNode('2'),
        ]),
        newFileNode('var2', [
            newFileNode('.zarray'),
            newFileNode('.zattrs'),
            newFileNode('0'),
            newFileNode('1'),
            newFileNode('2'),
        ]),
        newFileNode('var3', [
            newFileNode('.zarray'),
            newFileNode('.zattrs'),
            newFileNode('0'),
            newFileNode('1'),
            newFileNode('2'),
        ]),
        newFileNode('var4', undefined, true, 'updating'),
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
    newFileNode('Dir-4', undefined, true, 'error'),
    newFileNode('File-1.txt'),
    newFileNode('File-2'),
    newFileNode('File-3.txt'),
]);
