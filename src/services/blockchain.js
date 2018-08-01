import co from 'co'
import {decryptBlob} from './note'
import {createGlxTransaction} from './transaction'
import web3 from './web3'
import range from 'lodash-es/range'
// import store from '../renderer/store'
// import electronWorkers from 'electron-workers'
// import ChainSyncWorker from '../workers/chain-sync.worker'

const debug = require('debug')('blockchain')

/**
 * Sync chain for account
 *
 * @param account
 * @param {array} transactions
 */
export const syncChain = (account, transactions) => {
  return co(function* () {
    const myAddr = account.address
    const currentBlock = yield web3.eth.getBlockNumber()
    let n = yield web3.eth.getTransactionCount(myAddr, currentBlock)
    let bal = yield web3.eth.getBalance(myAddr, currentBlock)
    const blockBatchSize = 100

    for (let i = currentBlock; i >= 0 && (n > 0 || bal > 0); i = i - blockBatchSize) {
      try {
        const fromBlock = i
        const toBlock = i - blockBatchSize + 1
        const blocks = yield range(fromBlock, toBlock).map(bn => {
          if (bn < 0) return
          return web3.eth.getBlock(bn, true)
        })

        console.log(`Processing blocks ${fromBlock} to ${toBlock}`)

        blocks.forEach(block => {
          if (block && block.transactions) {
            block.transactions.forEach(tx => {
              if (myAddr === tx.from) {
                if (tx.from !== tx.to) {
                  bal = bal.add(tx.value)
                }
                console.log(i, tx.from, tx.to, tx.value.toString(10))
                --n
              }

              if (myAddr === tx.to) {
                if (tx.from !== tx.to) {
                  bal = bal.sub(tx.value)
                }
                console.log(i, tx.from, tx.to, tx.value.toString(10))
              }
            })
          }
        })
      } catch (e) {
        console.error('Error in block ' + i, e)
      }
    }
  })

  // const worker = new ChainSyncWorker()
  // worker.postMessage(JSON.parse(JSON.stringify({account, transactions})))
  // worker.onmessage = e => {
  //   console.log('Recieved from worker', e)
  // }

  // const worker = electronWorkers({
  //   connectionMode: 'ipc',
  //   pathToScript: 'src/workers/chain-sync.js',
  //   timeout: Number.MAX_SAFE_INTEGER,
  //   numberOfWorkers: 1,
  // })
  //
  // worker.start(startErr => {
  //   if (startErr) return console.error(startErr)
  //
  //   // `electronWorkers` will send your data in a POST request to your electron script
  //   worker.execute({someData: 'someData'}, (err, data) => {
  //     if (err) return console.error(err)
  //
  //     console.log(JSON.stringify(data)) // { value: 'someData' }
  //     worker.kill() // kill all workers explicitly
  //   })
  // })
}

/**
 * Check events from the latest all run (last block saved to tracker)
 *
 * @param {Bus} bus
 * @param tracker
 * @param account
 * @param transactions
 * @param tokenContract
 * @return {{event, args}}
 */
export const checkPastEvents = (bus, tracker, account, transactions, tokenContract) => {
  return co(function* () {
    debug(`Retrieving past events from block ${tracker.lastBlock} to the latest`)
    // TODO use {filter: {from: [12,13]}} to filter by needed account addresses as they are indexed
    // TODO split by event types into different methods
    const events = yield tokenContract.getPastEvents('allEvents', {fromBlock: tracker.lastBlock, toBlock: 'latest'})
    debug(`Found ${events.length} past events`)

    events.forEach(event => {
      co(function* () {
        debug('Processing past event', {event})

        // Check if event type is what we need
        if (! ['LogTransfer', 'LogShielding', 'LogUnshielding', 'LogShieldedTransfer'].includes(event.event)) return

        // Check if belongs to account
        if (! [event.returnValues.from.toString().toLowerCase(), event.returnValues.to.toString().toLowerCase()]
          .includes(account.address.toLowerCase())) return

        // Check if transaction already added to an account
        // if (tracker.notes.find(n => n.uuid === event.args.uuid)) return

        // Check if note already added to a tracker
        if (tracker.notes.find(n => n.uuid === event.args.uuid)) return

        debug(`Loading block number ${event.blockNumber}`)
        const block = yield web3.eth.getBlock(event.blockNumber)

        switch (event.event) {
          case 'LogTransfer':
            // Check if transactions already exist
            if (transactions && transactions.find(tx => tx.hash === event.transactionHash)) return

            return bus.emit('glx-transfer', createGlxTransaction(event, account, block.timestamp))
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
