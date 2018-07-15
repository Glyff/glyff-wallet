import co from 'co'
import {decryptBlob} from './note'

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
    console.log(events)
    debug(`Found ${events.length} past events`)

    events.forEach(event => {
      debug('Processing past event', {event})

      // Check if event type is what we need
      if (! ['LogShielding', 'LogUnshielding', 'LogShieldedTransfer'].includes(event.event)) return
      // Check if belongs to any account
      if (accounts.find(a => a.address.toLowerCase() === event.args.from.toString().toLowerCase())) return
      // Check if already added to a tracker
      if (tracker.notes.find(n => n.uuid === event.args.uuid)) return

      switch (event.event) {
        case 'LogShielding':
          return bus.emit('new-past-shielding', event)
        case 'LogUnshielding':
          return bus.emit('new-past-unshielding', event)
        case 'LogShieldedTransfer':
          const note = decryptBlob(tracker, event.args.blob, event.args.from.toString(), tokenContract)

          return bus.emit('new-past-shielded-transfer', note)
      }
    })
  })
}
