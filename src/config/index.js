import os from 'os'
import BN from 'bn.js'

export default {

  // Node settings
  node: {
    host: '127.0.0.1',
    port: 8545,
    // port: 18545,
  },

  homeDir: os.homedir() + '/.glyff-wallet/',

  appPath: process.cwd(),

  token: {
    address: '0xf80e2fec3ccd3d049cf5a9f08535a418b78f732a',
    abi: require('./token_abi'),
  },

  unshieldGas: new BN(200000),

  /** {Number} The number of max unspent notes outputs that can be unshielded for a transaction */
  maxUnshieldings: 6,

  version: require('../../package.json').version,
}
