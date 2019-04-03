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
    from: data.from,
    to: data.to,
    value: new BN(data.value),
    date: data.timestamp ? moment.unix(data.timestamp) : moment(),
  }
}

/**
 * Create GLS transaction from event
 *
 * @param block
 * @param tracker
 * @param note
 * @param type
 * @return {*}
 */
export const createGlsTransaction = (block, tracker, note, type) => {
  return {
    type: 'GLS',
    hash: note.txHash,
    blockNumber: block.number,
    from: type === 'shield' || type === 'transfer' ? note.address : null,
    to: type === 'unshiled' ? note.address : null,
    value: new BN(note.value),
    date: note.timestamp ? moment.unix(note.timestamp) : moment(),
  }
}
