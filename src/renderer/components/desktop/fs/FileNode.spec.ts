import {
    getFileNodePath,
    isPathValidAtIndex,
    getFileNode,
    getParentDir,
    getBasenameExtension,
    getBasename,
    applyFileFilter,
    ALL_FILES_FILTER,
    fromPathInputValue,
    toPathInputValue, makeRelativePath
} from "./FileNode";
import { testData } from "./testData";

describe('makeRelativePath', () => {
    it('works with empty path', () => {
        const nodes = makeRelativePath("",
                                       "/home/users/norman/workspaces/test2");
        expect(nodes).toEqual("");
    });

    it('works with same path', () => {
        const nodes = makeRelativePath("/home/users/norman/workspaces/test2",
                                       "/home/users/norman/workspaces/test2");
        expect(nodes).toEqual("");
    });

    it('works with 1 element inside', () => {
        const nodes = makeRelativePath("/home/users/norman/workspaces/test2/precip.nc",
                                       "/home/users/norman/workspaces/test2");
        expect(nodes).toEqual("precip.nc");
    });

    it('works with 2 elements inside', () => {
        const nodes = makeRelativePath("/home/users/norman/workspaces/test2/data/precip.nc",
                                       "/home/users/norman/workspaces/test2");
        expect(nodes).toEqual("data/precip.nc");
    });

    it('works with 1 element outside', () => {
        const nodes = makeRelativePath("/home/users/norman/workspaces/test1/precip.nc",
                                       "/home/users/norman/workspaces/test2");
        expect(nodes).toEqual("../test1/precip.nc");
    });

    it('works with 2 elements outside', () => {
        const nodes = makeRelativePath("/home/users/norman/precip.nc",
                                       "/home/users/norman/workspaces/test2");
        expect(nodes).toEqual("../../precip.nc");
    });

    it('works with 2 elements outside (2)', () => {
        const nodes = makeRelativePath("/home/users/norman/data/precip.nc",
                                       "/home/users/norman/workspaces/test2");
        expect(nodes).toEqual("../../data/precip.nc");
    });
});

describe('toPathInputValue', () => {

    it('works for single empty selectedPaths', () => {
        const selectedPath = toPathInputValue([], false);
        expect(selectedPath).toEqual('');
    });

    it('works for multi empty selectedPaths', () => {
        const selectedPath = toPathInputValue([], true);
        expect(selectedPath).toEqual('');
    });

    it('works for single selectedPaths', () => {
        const selectedPath = toPathInputValue(['report.txt'], false);
        expect(selectedPath).toEqual('report.txt');
    });

    it('works for multi selectedPaths', () => {
        const selectedPath = toPathInputValue(['report.txt', 'data.csv'], true);
        expect(selectedPath).toEqual('report.txt data.csv');
    });

    it('works for single selectedPaths with space', () => {
        const selectedPath = toPathInputValue(['my report.txt'], false);
        expect(selectedPath).toEqual('my report.txt');
    });

    it('works for multi selectedPaths with space', () => {
        const selectedPath = toPathInputValue(['my report.txt', 'my data.csv'], true);
        expect(selectedPath).toEqual('"my report.txt" "my data.csv"');
    });

    it('works for multi selectedPaths with current dir', () => {
        const selectedPath = toPathInputValue(['home/norman/report.txt', 'home/norman/data.csv'], true);
        expect(selectedPath).toEqual('report.txt data.csv');
    });

    it('works for multi selectedPaths with space with current dir', () => {
        const selectedPath = toPathInputValue(['home/norman/my report.txt', 'home/norman/my data.csv'], true);
        expect(selectedPath).toEqual('"my report.txt" "my data.csv"');
    });
});

describe('fromPathInputValue', () => {

    it('works for empty inputValue', () => {
        const selectedPath = fromPathInputValue('', '', false);
        expect(selectedPath).toEqual([]);
    });

    it('works for single inputValue', () => {
        const selectedPath = fromPathInputValue('data.csv', '', false);
        expect(selectedPath).toEqual(['data.csv']);
    });

    it('works for single inputValue with current dir', () => {
        const selectedPath = fromPathInputValue('data.csv', 'home/norman', false);
        expect(selectedPath).toEqual(['home/norman/data.csv']);
    });

    it('works for single inputValue with space', () => {
        const selectedPath = fromPathInputValue('my data.csv', '', false);
        expect(selectedPath).toEqual(['my data.csv']);
    });

    it('works for non-quoted multi inputValue with space', () => {
        const selectedPath = fromPathInputValue('my data.csv', '', true);
        expect(selectedPath).toEqual(['my', 'data.csv']);
    });

    it('works for multi selectedPaths with current dir', () => {
        const selectedPath = fromPathInputValue('report.txt data.csv', 'home/norman', true);
        expect(selectedPath).toEqual(['home/norman/report.txt', 'home/norman/data.csv']);
    });

    it('works for quoted multi inputValue with space inside', () => {
        const selectedPath = fromPathInputValue('"my data.csv"', '', true);
        expect(selectedPath).toEqual(['my data.csv']);
    });

    it('works for quoted multi inputValue with quotes inside', () => {
        const selectedPath = fromPathInputValue('"my data.csv" "you\'r a weirdo" \'"chl".zarr\'', '', true);
        expect(selectedPath).toEqual(['my data.csv', "you'r a weirdo", '"chl".zarr']);
    });

    it('works for non-quoted multi inputValue', () => {
        const selectedPath = fromPathInputValue('my_data.csv you-are-a-weirdo chl.zarr', '', true);
        expect(selectedPath).toEqual(['my_data.csv', 'you-are-a-weirdo', 'chl.zarr']);
    });
});

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


