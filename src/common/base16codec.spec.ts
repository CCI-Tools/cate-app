import { expect } from 'chai';
import Base16 from './base16codec';

describe('codec', function () {
    it('works for empty string', function () {
        expect(Base16.encode("")).to.equal("");
        expect(Base16.decode("")).to.equal("");
    });

    it('works for a path string', function () {
        expect(Base16.encode("/workspaces/bibo")).to.equal(
            "2F776F726B7370616365732F6269626F"
        );
        expect(Base16.decode("2F776F726B7370616365732F6269626F")).to.equal(
            "/workspaces/bibo"
        );
    });
});