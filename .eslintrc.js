module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
  },
  extends: 'standard',
  globals: {
    __static: true,
    '$': false,
    'jQuery': false,
    'Together': false,
    'bootbox': false,
    'Stripe': false,
  },
  plugins: [
    'html',
  ],
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,

    'comma-dangle': 0,

    'space-unary-ops': [2, {
      'words': true,
      'nonwords': true,
      'overrides': {
        '++': false,
        '--': false,
      },
    }],
  },
}
