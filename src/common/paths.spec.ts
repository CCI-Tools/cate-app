import { getBasename, getBasenameExtension, getParentPath, makeRelativePath, makeAbsolutePath } from './paths';


describe('makeAbsolutePath', () => {
    it('works with empty path', () => {
        const nodes = makeAbsolutePath("/home/users/norman/workspaces/test2",
                                       "");
        expect(nodes).toEqual("/home/users/norman/workspaces/test2");
    });

    it('works with 1 element inside', () => {
        const nodes = makeAbsolutePath("/home/users/norman/workspaces/test2",
                                       "precip.nc");
        expect(nodes).toEqual("/home/users/norman/workspaces/test2/precip.nc");
    });

    it('works with 2 elements inside', () => {
        const nodes = makeAbsolutePath("/home/users/norman/workspaces/test2",
                                       "data/precip.nc");
        expect(nodes).toEqual("/home/users/norman/workspaces/test2/data/precip.nc");
    });

    it('works with 1 element outside', () => {
        const nodes = makeAbsolutePath("/home/users/norman/workspaces/test2",
                                       "../test1/precip.nc");
        expect(nodes).toEqual("/home/users/norman/workspaces/test1/precip.nc",
        );
    });

    it('works with 2 elements outside', () => {
        const nodes = makeAbsolutePath("/home/users/norman/workspaces/test2",
                                       "../../precip.nc");
        expect(nodes).toEqual("/home/users/norman/precip.nc");
    });

    it('works with 2 elements outside nested', () => {
        const nodes = makeAbsolutePath("/home/users/norman/workspaces/test2",
                                       "../../data/precip.nc");
        expect(nodes).toEqual("/home/users/norman/data/precip.nc",
        );
    });
});

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

    it('works with 2 elements outside nested', () => {
        const nodes = makeRelativePath("/home/users/norman/data/precip.nc",
                                       "/home/users/norman/workspaces/test2");
        expect(nodes).toEqual("../../data/precip.nc");
    });
});

describe('getParentPath', () => {
    it('works as expected', () => {
        expect(getParentPath('Dir-2/Dir-21/Dir-211')).toEqual('Dir-2/Dir-21');
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
