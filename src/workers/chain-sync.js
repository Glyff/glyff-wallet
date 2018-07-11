// TODO

const myAddr = '0xbb9bc244d798123fde783fcc1c72d3bb8c189413'
const currentBlock = web3.eth.blockNumber
let n = web3.eth.getTransactionCount(myAddr, currentBlock)
let bal = web3.eth.getBalance(myAddr, currentBlock)

/*
 * Heuristic approach without having to process the entire chain
 */
for (let i = currentBlock; i >= 0 && (n > 0 || bal > 0); --i) {
  try {
    const block = web3.eth.getBlock(i, true)

    if (block && block.transactions) {
      block.transactions.forEach(tx => {
        if (myAddr === tx.from) {
          if (tx.from !== tx.to) { bal = bal.add(tx.value) }
          console.log(i, tx.from, tx.to, tx.value.toString(10))
          --n
        }

        if (myAddr === tx.to) {
          if (tx.from !== tx.to) { bal = bal.sub(tx.value) }
          console.log(i, tx.from, tx.to, tx.value.toString(10))
        }
      })
    }
  } catch (e) {
    console.error('Error in block ' + i, e)
  }
}
