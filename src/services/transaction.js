import moment from 'moment'
import BN from 'bn.js'

/**
 * Create GLX token transaction from event
 *
 * @param event
 * @param account
 * @param timestamp If null, use current time
 * @return {*}
 */
export const createGlxTransaction = (event, account, timestamp = null) => {
  const tx = {
    type: 'GLX',
    hash: event.transactionHash,
    blockNumber: event.blockNumber,
    from: event.returnValues.from.toString().toLowerCase(),
    to: event.returnValues.to.toString().toLowerCase(),
    amount: new BN(event.returnValues.value),
    date: timestamp ? moment.unix(timestamp) : moment(),
  }
  tx.direction = account.address.toLowerCase() === tx.from ? 'out' : 'in'

  return tx
}

/**
 * Create GLY transaction from event
 *
 * @param data
 * @param account
 * @param timestamp If null, use current time
 * @return {*}
 */
export const createGLYTransaction = (data, account, timestamp = null) => {
  const tx = {
    type: 'GLY',
    hash: data.transactionHash,
    blockNumber: data.blockNumber,
    from: data.from.toString().toLowerCase(),
    to: data.to.toString().toLowerCase(),
    amount: new BN(data.value),
    date: timestamp ? moment.unix(timestamp) : moment(),
  }
  tx.direction = account.address.toLowerCase() === tx.from ? 'out' : 'in'

  return tx
}
