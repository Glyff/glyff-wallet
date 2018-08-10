import co from 'co'
import BN from 'bn.js'
import {decryptBlob} from './note'
import {createGlxTransaction, createGlyTransaction} from './transaction'
import web3 from './web3'
import range from 'lodash-es/range'
import chunk from 'lodash-es/chunk'

const debug = require('debug')('blockchain')

/**
 * Watch new blocks
 *
 * @param bus
 */
export const watchNewBlocks = (bus, accounts, transactions) => {
  web3.eth.subscribe('newBlockHeaders', function (error, result) {
    if (error) throw error
  }).on('data', function (blockHeader) {
    web3.eth.getBlock(blockHeader.number).then(block => {
      bus.emit('new-block', block)
      syncBlock(block, accounts.map(a => a.address), transactions)
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
                bus.emit('gly-transfer', createGlyTransaction(tx, data[tx.from], block.timestamp))
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
                bus.emit('gly-transfer', createGlyTransaction(tx, data[tx.to], block.timestamp))
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
        bus.emit('gly-transfer', createGlyTransaction(tx, {address: tx.from}, block.timestamp))
      }
    }

    // If tx from address is in our data object then emit new incoming transaction
    if (addresses[tx.to]) {
      debug('syncChain: found incoming transaction', tx)
      // Check if transaction already exists, emit new transaction event
      if (! transactions[tx.to].find(t => t.hash === tx.hash)) {
        bus.emit('gly-transfer', createGlyTransaction(tx, {address: tx.to}, block.timestamp))
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
    const addresses = accounts.map(a => a.address)
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
    debug(`checkPastEvents: retrieving past events from block ${tracker.lastBlock} to the latest`)
    // TODO use {filter: {from: [12,13]}} to filter by needed account addresses as they are indexed
    // TODO split by event types into different methods
    const events = yield tokenContract.getPastEvents('allEvents', {fromBlock: tracker.lastBlock, toBlock: 'latest'})
    debug(`checkPastEvents: found ${events.length} past events`)

    events.forEach(event => {
      co(function* () {
        debug('checkPastEvents: processing past event', {event})

        // Check if event type is what we need
        if (! ['LogTransfer', 'LogShielding', 'LogUnshielding', 'LogShieldedTransfer'].includes(event.event)) return

        // Check if belongs to account
        if (! [event.returnValues.from.toString().toLowerCase(), event.returnValues.to.toString().toLowerCase()]
          .includes(account.address.toLowerCase())) return

        // Check if transaction already added to an account
        // if (tracker.notes.find(n => n.uuid === event.args.uuid)) return

        // Check if note already added to a tracker
        if (tracker.notes.find(n => n.uuid === event.args.uuid)) return

        debug(`checkPastEvents: loading block number ${event.blockNumber}`)
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
