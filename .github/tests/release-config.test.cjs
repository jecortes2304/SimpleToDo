const assert = require('node:assert/strict');
const test = require('node:test');
const releaseConfig = require('../../.releaserc.cjs');

const analyzerOptions = releaseConfig.plugins.find(([name]) => name === '@semantic-release/commit-analyzer')[1];
const releaseForType = (type) => analyzerOptions.releaseRules.find((rule) => rule.type === type)?.release;

test('uses main for stable releases and develop for snapshots', () => {
    assert.deepEqual(releaseConfig.branches, [
        'main',
        {name: 'develop', prerelease: 'snapshot'},
    ]);
    assert.equal(releaseConfig.tagFormat, 'v${version}');
});

test('maps Conventional Commit types to the agreed SemVer increments', () => {
    assert.equal(releaseForType('feat'), 'minor');
    assert.equal(releaseForType('fix'), 'patch');
    for (const type of ['chore', 'docs', 'refactor', 'test', 'ci', 'build', 'perf', 'style', 'revert']) {
        assert.equal(releaseForType(type), 'patch', `${type} must produce a patch release`);
    }
    assert.ok(analyzerOptions.releaseRules.some((rule) => rule.breaking === true && rule.release === 'major'));
});
