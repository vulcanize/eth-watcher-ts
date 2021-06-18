const { defaults } = require('jest-config');
module.exports = {
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
    testPathIgnorePatterns: ['node_modules', 'dist'],
    transform: {
        "^.+\\.ts$": "ts-jest"
    },
    testEnvironment: './src/jest-environment.js',
};
