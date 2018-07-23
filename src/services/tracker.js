import co from 'co'
import web3 from './web3'
import uuid from 'uuid'

/**
 * Create tracker
 *
 * @return {*}
 */
export const createTracker = () => {
  return co(function* () {
    const keyPair = yield web3.zsl.generateZKeypair()

    return Object.assign({}, keyPair, {
      uuid: uuid.v4(),
      notes: [],
      spent: [],
      lastBlock: 0,
    })
  })
}
