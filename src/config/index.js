import os from 'os'

export default {

  // Node settings
  node: {
    host: '185.141.24.38',
    port: 18545,
  },

  homeDir: os.homedir() + '/.glyff-wallet/',

  appPath: process.cwd(),

  token: {
    address: '0x0a54a5237dd535de0e67d3c12cfc5bcd2cf3e917',
    abi: require('./token_abi'),
  }
}
