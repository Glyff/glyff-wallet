import co from 'co'
import web3 from './web3'

/**
 * Create tracker
 *
 * @return {*}
 */
export const createTracker = () => {
  return co(function* () {
    const keyPair = yield web3.zsl.generateZKeypair()

    return Object.assign({}, keyPair, {
      notes: [],
      spent: [],
      lastBlock: web3.eth.blockNumber,
    })
  })
}
