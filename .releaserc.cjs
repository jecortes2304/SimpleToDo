'use strict';

module.exports = {
    branches: [
        'main',
        {name: 'develop', prerelease: 'snapshot'},
    ],
    tagFormat: 'v${version}',
    plugins: [
        [
            '@semantic-release/commit-analyzer',
            {
                preset: 'conventionalcommits',
                releaseRules: [
                    {breaking: true, release: 'major'},
                    {type: 'feat', release: 'minor'},
                    {type: 'fix', release: 'patch'},
                    {type: 'chore', release: 'patch'},
                    {type: 'docs', release: 'patch'},
                    {type: 'refactor', release: 'patch'},
                    {type: 'test', release: 'patch'},
                    {type: 'ci', release: 'patch'},
                    {type: 'build', release: 'patch'},
                    {type: 'perf', release: 'patch'},
                    {type: 'style', release: 'patch'},
                    {type: 'revert', release: 'patch'},
                ],
            },
        ],
        [
            '@semantic-release/release-notes-generator',
            {preset: 'conventionalcommits'},
        ],
        [
            '@semantic-release/exec',
            {
                prepareCmd: 'RELEASE_VERSION=${nextRelease.version} GORELEASER_CURRENT_TAG=v${nextRelease.version} goreleaser release --snapshot --clean',
            },
        ],
        [
            '@semantic-release/github',
            {
                assets: [
                    'dist/*.tar.gz',
                    'dist/*.zip',
                    {path: 'dist/checksums.txt', label: 'SHA-256 checksums'},
                ],
            },
        ],
    ],
};
