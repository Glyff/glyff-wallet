module.exports = {
  verbose: true,
  moduleFileExtensions: [
    'js',
    'json',
    'vue',
    'ts',
    'tsx',
    'jsx',
    'node',
  ],
  transform: {
    '\\.js$': 'babel-jest',
    '\\.vue$': 'vue-jest',
  },
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/mocks/file-mock.js',
    '\\.(css|less)$': '<rootDir>/tests/mocks/style-mock.js',
  },
  moduleDirectories: [
    'node_modules',
    'src',
  ],
  testRegex: 'tests/unit/(.*).test.js',
  coverageDirectory: '<rootDir>/tests/unit/coverage',
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/config',
    '!src/errors',
    '!src/main',
    '!src/renderer/router',
    '!**/node_modules/**'
  ]
}
