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
    address: '0x2f02f456c04b3597459fea1efcf7cdb8cac22475',
    abi: require('./token_abi'),
  },

  unshieldGas: 125000,

  version: require('../../package.json').version,
}
