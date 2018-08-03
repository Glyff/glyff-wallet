/* eslint-disable */
const debug = require('../../node_modules/debug/src/index')('chain-sync')
const web3 = require('../services/web3')
const app = require('electron').app

const workerId = process.env.ELECTRON_WORKER_ID // worker id useful for logging

debug('Hello from worker', workerId)

/*
 * Heuristic approach without having to process the entire chain
 */
const syncChain = (account, transactions) => {
  const myAddr = '0xbb9bc244d798123fde783fcc1c72d3bb8c189413'
  const currentBlock = web3.eth.blockNumber
  let n = web3.eth.getTransactionCount(myAddr, currentBlock)
  let bal = web3.eth.getBalance(myAddr, currentBlock)

  for (let i = currentBlock; i >= 0 && (n > 0 || bal > 0); --i) {
    try {
      const block = web3.eth.getBlock(i, true)

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
    } catch (e) {
      console.error('Error in block ' + i, e)
    }
  }
}

app.on('ready', () => {
  // first you will need to listen the `message` event in the process object
  process.on('message', data => {
    if (! data) return

    // `electron-workers` will try to verify is your worker is alive sending you a `ping` event
    if (data.workerEvent === 'ping') {
      // responding the ping call.. this will notify `electron-workers` that your process is alive
      process.send({workerEvent: 'pong'})
    } else if (data.workerEvent === 'task') { // when a new task is executed, you will recive a `task` event
      debug(data) // data -> { workerEvent: 'task', taskId: '....', payload: <whatever you have passed to `.execute`> }

      // you can do whatever you want here..

      // when the task has been processed,
      // respond with a `taskResponse` event, the `taskId` that you have received, and a custom `response`.
      // You can specify an `error` field if you want to indicate that something went wrong
      process.send({
        workerEvent: 'taskResponse',
        taskId: data.taskId,
        response: {
          value: data.payload.someData,
        },
      })
    }
  })
})
