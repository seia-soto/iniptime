/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  resolver: require.resolve('jest-pnp-resolver'),
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    }
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  }
}
