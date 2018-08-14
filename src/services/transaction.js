import moment from 'moment'
import BN from 'bn.js'

/**
 * Create GLX token transaction from event
 *
 * @param event
 * @return {*}
 */
export const createGlxTransaction = (event) => {
  return {
    type: 'GLX',
    hash: event.transactionHash,
    blockNumber: event.blockNumber,
    from: event.returnValues.from.toString(),
    to: event.returnValues.to.toString(),
    value: new BN(event.returnValues.value),
    date: event.timestamp ? moment.unix(event.timestamp) : moment(),
  }
}

/**
 * Create GLY transaction from event
 *
 * @param data
 * @return {*}
 */
export const createGlyTransaction = (data) => {
  return {
    type: 'GLY',
    hash: data.transactionHash || data.hash,
    blockNumber: data.blockNumber,
    from: data.from.toString(),
    to: data.to.toString(),
    value: new BN(data.value),
    date: data.timestamp ? moment.unix(data.timestamp) : moment(),
  }
}
