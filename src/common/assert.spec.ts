import { expect } from 'chai';
import * as assert from './assert';

describe('assert.ok', function () {

    function shouldSucceed(condition) {
        assert.ok(condition);
    }

    function shouldFail(condition) {
        try {
            assert.ok(condition);
        } catch (e) {
            expect(e).to.be.instanceof(Error);
            expect(e.message).to.equal('assertion failed');
        }
    }

    it('works', function () {
        shouldSucceed(true);
        shouldSucceed(2);
        shouldSucceed('x');
        shouldSucceed({});
        shouldSucceed([]);

        let x;
        //noinspection JSUnusedAssignment
        shouldFail(false);
        shouldFail(null);
        shouldFail(0);
        shouldFail(x);
        shouldFail('');
    });
});

