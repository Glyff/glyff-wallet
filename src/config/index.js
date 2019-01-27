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
    address: '0xB2D4Ea389f4E39150f84047680b6E3AeD149123f',
    abi: require('./token_abi'),
  },

  unshieldGas: new BN(125000),

  /** {Number} The number of max unspent notes outputs that can be unshielded for a transaction */
  maxUnshieldings: 6,

  version: require('../../package.json').version,
}
