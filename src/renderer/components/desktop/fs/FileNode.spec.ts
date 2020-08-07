import {
    getFileNodePath,
    isPathValidAtIndex,
    getFileNode,
    getParentDir,
    getBasenameExtension,
    getBasename,
    applyFileFilter, ALL_FILES_FILTER
} from "./FileNode";
import { testData } from "./testData";

describe('applyFileFilter', () => {

    it('works for single extension', () => {
        const nodes = applyFileFilter(testData.childNodes[1].childNodes[0].childNodes,
                                     {name: 'netcdf', extensions: ['nc']});
        expect(nodes).not.toBeFalsy();
        expect(nodes.map(n => n.name)).toEqual(['Dir-211', 'File-211.nc', 'File-212.nc']);
    });

    it('works for 2 extensions', () => {
        const nodes = applyFileFilter(testData.childNodes[1].childNodes[0].childNodes,
                                      {name: 'netcdf and geojson', extensions: ['nc', 'geojson']});
        expect(nodes).not.toBeFalsy();
        expect(nodes.map(n => n.name)).toEqual(['Dir-211', 'File-211.nc', 'File-212.nc', 'File-214.geojson']);
    });

    it('works for "all files" filter', () => {
        const nodes = applyFileFilter(testData.childNodes[1].childNodes[0].childNodes,
                                      ALL_FILES_FILTER);
        expect(nodes).toBe(testData.childNodes[1].childNodes[0].childNodes);
    });
});

describe('getFileNode', () => {

    it('returns correct node for root', () => {
        const node = getFileNode(testData, '');
        expect(node).toBe(testData);
    });

    it('returns correct node', () => {
        const node = getFileNode(testData, 'Dir-2/Dir-21/Dir-211/File-2111.txt');
        expect(node).not.toBeFalsy();
        expect(node.name).toEqual('File-2111.txt');
    });

    it('returns correct path for trailing "/"', () => {
        const node = getFileNode(testData, 'Dir-2/Dir-21/Dir-211/');
        expect(node).not.toBeFalsy();
        expect(node.name).toEqual('Dir-211');
    });

    it('returns null on invalid path', () => {
        const node = getFileNode(testData, 'Dir-2/Dir-211/Dir-21/File-2111.txt');
        expect(node).toBe(null);
    });

    it('returns null on invalid rootNode', () => {
        const node = getFileNode({...testData, childNodes: undefined}, 'Dir-2');
        expect(node).toBe(null);
    });
});


describe('getFileNodePath', () => {

    it('returns correct path for root', () => {
        const path = getFileNodePath(testData, '');
        expect(path).toEqual([]);
    });

    it('returns correct path', () => {
        const path = getFileNodePath(testData, 'Dir-2/Dir-21/Dir-211/File-2111.txt');
        expect(path).not.toBeFalsy();
        expect(path.length).toBe(4);
        expect(path.map(n => n.name).join('/')).toEqual('Dir-2/Dir-21/Dir-211/File-2111.txt');
    });

    it('returns correct path for trailing "/"', () => {
        const path = getFileNodePath(testData, 'Dir-2/Dir-21/Dir-211/');
        expect(path).not.toBeFalsy();
        expect(path.length).toBe(3);
        expect(path.map(n => n.name).join('/')).toEqual('Dir-2/Dir-21/Dir-211');
    });

    it('returns null on invalid path', () => {
        const path = getFileNodePath(testData, 'Dir-2/Dir-211/Dir-21/File-2111.txt');
        expect(path).toBe(null);
    });

    it('returns null on invalid rootNode', () => {
        const path = getFileNodePath({...testData, childNodes: undefined}, 'Dir-2');
        expect(path).toBe(null);
    });
});

describe('getParentDir', () => {
    it('works as expected', () => {
        expect(getParentDir('Dir-2/Dir-21/Dir-211')).toEqual('Dir-2/Dir-21');
    });
});

describe('getBasename', () => {
    it('works as expected', () => {
        expect(getBasename('Dir-2/Dir-21/Dir-211/File-2111.txt')).toEqual('File-2111.txt');
    });
});


describe('getBasenameExtension', () => {
    it('works as expected', () => {
        expect(getBasenameExtension('File-2111.txt')).toEqual('txt');
    });
});

describe('isPathValidAtIndex', () => {

    it('should recognize invalid index', () => {
        expect(isPathValidAtIndex(['a', 'b', 'c'], -1, 'a')).toBe(false);
        expect(isPathValidAtIndex(['a', 'b', 'c'], 3, 'c')).toBe(false);
    });

    it('should recognize invalid name', () => {
        expect(isPathValidAtIndex(['a', 'b', 'c'], 0, 'a')).toBe(true);
        expect(isPathValidAtIndex(['a', 'b', 'c'], 1, 'b')).toBe(true);
        expect(isPathValidAtIndex(['a', 'b', 'c'], 2, 'c')).toBe(true);
        expect(isPathValidAtIndex(['a', 'b', 'c'], 2, 'd')).toBe(false);
    });
});


