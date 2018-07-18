import co from 'co'
import {decryptBlob} from './note'
import {createGlxTransaction} from './transaction'
import web3 from './web3'

const debug = require('debug')('blockchain')

export const syncChain = () => {
  // TODO
}

/**
 * Check events from the latest all run (last block saved to tracker)
 *
 * @param {Bus} bus
 * @param tracker
 * @param accounts
 * @param tokenContract
 * @return {{event, args}}
 */
export const checkPastEvents = (bus, tracker, accounts, tokenContract) => {
  return co(function* () {
    debug(`Retrieving past events from block ${tracker.lastBlock} to the latest`)
    // TODO use {filter: {from: [12,13]}} to filter by needed account addresses as they are indexed,
    const events = yield tokenContract.getPastEvents('allEvents', {fromBlock: tracker.lastBlock, toBlock: 'latest'})
    debug(`Found ${events.length} past events`)

    events.forEach(event => {
      co(function* () {
        debug('Processing past event', {event})

        // Check if event type is what we need
        if (! ['LogTransfer', 'LogShielding', 'LogUnshielding', 'LogShieldedTransfer'].includes(event.event)) return
        const account = accounts.find(a => [event.returnValues.from.toString().toLowerCase(), event.returnValues.to.toString().toLowerCase()]
          .includes(a.address.toLowerCase()))
        // Check if belongs to any account
        if (! account) return
        // Check if transaction already added to an account
        // if (tracker.notes.find(n => n.uuid === event.args.uuid)) return
        // Check if note already added to a tracker
        if (tracker.notes.find(n => n.uuid === event.args.uuid)) return

        debug(`Loading block number ${event.blockNumber}`)
        const block = yield web3.eth.getBlock(event.blockNumber)

        switch (event.event) {
          case 'LogTransfer':
            return bus.emit('gly-transfer', createGlxTransaction(event, account, block.timestamp))
          case 'LogShielding':
            return bus.emit('shielding', event)
          case 'LogUnshielding':
            return bus.emit('unshielding', event)
          case 'LogShieldedTransfer':
            const note = decryptBlob(tracker, event.returnValues.blob, event.returnValues.from.toString(), tokenContract)

            return bus.emit('shielded-transfer', note)
        }
      })
    })
  })
}
