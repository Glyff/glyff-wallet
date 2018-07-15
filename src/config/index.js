import os from 'os'

export default {

  // Node settings
  node: {
    host: '10.10.4.20',
    port: 18545,
  },

  homeDir: os.homedir() + '/.glyff-wallet/',

  appPath: process.cwd(),

  token: {
    address: '0x82bbaee36211447bca79b75929ebbc63ca90753d',
    abi: require('./token_abi'),
  },

  unshieldGas: 125000,

  /** {Number} The number of max unspent notes outputs that can be unshielded for a transaction */
  maxUnshieldings: 6,

  version: require('../../package.json').version,
}
