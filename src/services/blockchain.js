import co from 'co'
import BN from 'bn.js'
// import {decryptBlob} from './note'
import web3 from './web3'
import range from 'lodash-es/range'
import chunk from 'lodash-es/chunk'

const debug = require('debug')('app:blockchain')

/**
 * Watch new blocks
 *
 * @param bus
 * @param accounts
 * @param transactions
 */
export const watchNewBlocks = (bus, accounts, transactions) => {
  web3.eth.subscribe('newBlockHeaders', function (error, result) {
    if (error) throw error
  }).on('data', function (blockHeader) {
    web3.eth.getBlock(blockHeader.number).then(block => {
      bus.emit('new-block', block)
      const addresses = {}
      accounts.forEach(a => (addresses[a.address] = true))
      syncBlock(block, addresses, transactions)
    })
  })
}

/**
 * Sync chain for account heuristic way
 *
 * @param bus
 * @param accounts
 * @param {array} transactions
 */
export const syncChainHeuristic = (bus, accounts, transactions) => {
  return co(function* () {
    debug('Started syncChainHeuristic')
    const data = {}
    yield accounts.map(a => {
      return co(function* () {
        data[a.address] = {
          address: a.address,
          n: yield web3.eth.getTransactionCount(a.address),
          bal: new BN(yield web3.eth.getBalance(a.address)),
        }
      })
    })
    const currentBlock = yield web3.eth.getBlockNumber()
    const blockBatchSize = 500
    const failedBlocks = []

    for (let i = currentBlock; i >= 0 && Object.values(data).some(d => d.n > 0 || d.bal > 0); i = i - blockBatchSize) {
      try {
        const fromBlock = i
        let toBlock = i - blockBatchSize + 1
        if (toBlock < 0) toBlock = 0

        // Load all blocks simultaneously
        const blocks = yield range(fromBlock, toBlock).map(bn => {
          return web3.eth.getBlock(bn, true)
            .catch(e => {
              debug(`syncChainHeuristic: failed to load block ${bn}, error: ${e.message}`)
              failedBlocks.push(bn)
            })
        })

        debug(`syncChainHeuristic: processing blocks ${fromBlock} to ${toBlock}`)

        blocks.forEach(block => {
          if (! block || ! block.transactions.length) return

          block.transactions.forEach(tx => {
            // If tx from address is in our data object then emit new outgoing transaction
            if (data[tx.from]) {
              debug('syncChainHeuristic: found outgoing transaction', tx)
              if (tx.from !== tx.to) {
                data[tx.from].bal = data[tx.from].bal.add(new BN(tx.value))
              }
              // Check if transaction already exists, emit new transaction event
              if (! transactions[tx.from].find(t => t.hash === tx.hash)) {
                bus.emit('gly-transfer', Object.assign({}, tx, {timestamp: block.timestamp}))
              }
              data[tx.from].n-- // Reduce transactions number for the address
            }

            // If tx from address is in our data object then emit new incoming transaction
            if (data[tx.to]) {
              debug('syncChainHeuristic: found incoming transaction', tx)
              if (tx.from !== tx.to) {
                data[tx.to].bal = data[tx.to].bal.sub(new BN(tx.value))
              }
              // Check if transaction already exists, emit new transaction event
              if (! transactions[tx.to].find(t => t.hash === tx.hash)) {
                bus.emit('gly-transfer', Object.assign({}, tx, {timestamp: block.timestamp}))
              }
            }
          })
        })

        bus.emit('synced-blocks-from', toBlock)
      } catch (e) {
        console.error('Error in block batch ' + i, e)
      }
    }

    console.log({failedBlocks})
    return currentBlock
  })
}

/**
 * Sync single block
 *
 * @param block
 * @param bus
 * @param addresses
 * @param transactions
 */
export const syncBlock = (block, bus, addresses, transactions) => {
  if (! block || ! block.transactions.length) return

  block.transactions.forEach(tx => {
    // If tx in addresses then emit new outgoing transaction
    if (addresses[tx.from]) {
      debug('syncChain: found outgoing transaction', tx)
      // Check if transaction already exists, emit new transaction event
      if (! transactions[tx.from].find(t => t.hash === tx.hash)) {
        bus.emit('gly-transfer', Object.assign({}, tx, {timestamp: block.timestamp}))
      }
    }

    // If tx from address is in our data object then emit new incoming transaction
    if (addresses[tx.to]) {
      debug('syncChain: found incoming transaction', tx)
      // Check if transaction already exists, emit new transaction event
      if (! transactions[tx.to].find(t => t.hash === tx.hash)) {
        bus.emit('gly-transfer', Object.assign({}, tx, {timestamp: block.timestamp}))
      }
    }
  })
}

/**
 * Sync blocks by numbers
 *
 * @param blockNumbers
 * @param bus
 * @param addresses
 * @param transactions
 */
export const syncBlocks = (blockNumbers, bus, addresses, transactions) => {
  return co(function* () {
    const blockBatchSize = 50
    const chunks = chunk(blockNumbers, blockBatchSize)
    for (let blocksChunk of chunks) {
      const blocks = yield blocksChunk.map(bn => {
        return web3.eth.getBlock(bn, true).catch(e => {
          debug(`syncBlocks: failed to load block ${bn}, error: ${e.message}`)
        })
      })

      debug(`syncBlocks: processing blocks ${blocksChunk[0]} to ${blocksChunk[blocksChunk.length - 1]}`)

      blocks.forEach(block => syncBlock(block, bus, addresses, transactions))
    }
  })
}

/**
 * Normal sync chain method
 *
 * @param bus
 * @param accounts
 * @param transactions
 * @param startBlock
 */
export const syncChain = (bus, accounts, transactions, startBlock) => {
  return co(function* () {
    const currentBlock = yield web3.eth.getBlockNumber()
    const blockBatchSize = 500
    const addresses = {}
    accounts.forEach(a => (addresses[a.address] = true))
    const failedBlocks = []

    for (let i = startBlock; i <= currentBlock; i = i + blockBatchSize) {
      try {
        const fromBlock = i
        let toBlock = i + blockBatchSize - 1
        if (toBlock > currentBlock) toBlock = currentBlock

        // Load all blocks simultaneously
        const blocks = yield range(fromBlock, toBlock).map(bn => {
          return web3.eth.getBlock(bn, true).catch(e => {
            debug(`syncChain: failed to load block ${bn}, error: ${e.message}`)
            failedBlocks.push(bn)
          })
        })

        debug(`syncChain: processing blocks ${fromBlock} to ${toBlock}`)

        blocks.forEach(block => syncBlock(block, bus, addresses, transactions))

        bus.emit('synced-blocks-to', toBlock)
      } catch (e) {
        console.error('Error in block batch ' + i, e)
      }
    }

    // If filed to load blocks found try to re-sync them wiht smaller chunks
    if (failedBlocks.length) {
      debug(`syncChain: ${failedBlocks.length} failed to load, try re-sync them wiht smaller chunks`)
      syncBlocks(failedBlocks, bus, addresses, transactions)
    }
    return currentBlock
  })
}

/**
 * Process event
 *
 * @param event
 * @param bus
 * @param trackers
 * @param accounts
 * @param transactions
 */
export const processEvent = (event, bus, trackers, accounts, transactions) => {
  return co(function* () {
    // Check if event type is what we need
    if (! ['LogTransfer', 'LogShielding', 'LogUnshielding', 'LogShieldedTransfer'].includes(event.event)) return

    const fromAccount = accounts.find(a => a.address === event.returnValues.from)
    const toAccount = accounts.find(a => a.address === event.returnValues.to)

    // Check if belongs to any of our accounts
    if (! fromAccount && ! toAccount) return

    // Check if transaction already added to an account
    // if (tracker.notes.find(n => n.uuid === event.args.uuid)) return

    const block = yield web3.eth.getBlock(event.blockNumber)

    if (['LogShielding', 'LogUnshielding', 'LogShieldedTransfer'].includes(event.event)) {
      // Check if we have this unconfirmed note
      if (! Object.values(trackers).find(accTrackers => accTrackers.find(tracker =>
        tracker.notes.find(n => ! n.confirmed && n.txHash === event.transactionHash)))) return
    }

    switch (event.event) {
      case 'LogTransfer':
        // Check if transactions already exist
        if (fromAccount && transactions[fromAccount.address].find(tx => tx.hash === event.transactionHash)) return
        if (toAccount && transactions[toAccount.address].find(tx => tx.hash === event.transactionHash)) return

        debug('processEvent: found new LogTransfer', {event})

        return bus.emit('glx-transfer', Object.assign({}, event, {timestamp: block.timestamp}))
      case 'LogShielding':
        return bus.emit('shielding', {block, event})
      case 'LogUnshielding':
        return bus.emit('unshielding', {block, event})
      case 'LogShieldedTransfer':
      // TODO find needed tracker?
      // const note = decryptBlob(tracker, event.returnValues.blob, event.returnValues.from.toString(), tokenContract)

      // return bus.emit('shielded-transfer', note)
    }
  })
}

/**
 * Check events from the latest all run (last block saved to tracker)
 *
 * @param {Bus} bus
 * @param trackers
 * @param accounts
 * @param transactions
 * @param tokenContract
 * @param lastBlock
 * @return {{event, args}}
 */
export const checkPastEvents = (bus, trackers, accounts, transactions, tokenContract, lastBlock) => {
  return co(function* () {
    debug(`checkPastEvents: retrieving past events from block ${lastBlock} to the latest`)
    // TODO use {filter: {from: [12,13]}} to filter by needed account addresses as they are indexed
    // TODO split by event types into different methods
    const events = yield tokenContract.getPastEvents('allEvents', {fromBlock: /* lastBlock || 0 */ 455000, toBlock: 'latest'})
    debug(`checkPastEvents: found ${events.length} past events`)

    events.forEach(event => {
      debug('checkPastEvents: new event ' + event.event, event)
      processEvent(event, bus, trackers, accounts, transactions)
    })
  })
}

/**
 * Watch for new events
 *
 * @param bus
 * @param trackers
 * @param accounts
 * @param transactions
 * @param tokenContract
 */
export const watchEvents = (bus, trackers, accounts, transactions, tokenContract) => {
  tokenContract.events.allEvents((err, event) => {
    if (err) return console.error(err)
    debug('watchEvents: new event ' + event.event, event)
    processEvent(event, bus, trackers, accounts, transactions)
  })
}
