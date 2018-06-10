import web3 from './web3'
import uuid from 'node-uuid'
import BigNumber from 'bignumber.js'
import config from '../config'
import store from '../renderer/store'

const debug = require('debug')('wallet')

export default {
  /**
   * Create a new wallet
   *
   * @param password
   * @param oToken
   * @return {{tokenContract, account, tracker}}
   */
  createWallet ({password, oToken}) {
    const account = {
      address: web3.personal.newAccount(password),
      balance: 0,
      id: 0,
      unlocked: false,
    }

    const tokenContract = web3.eth.contract(oToken.abi).at(oToken.address)

    const tracker = Object.assign({}, web3.zsl.GenerateZKeypair(), {
      id: 0,
      uuid: uuid.v4(),
      balance: 0,
      notes: [],
      spent: [],
      lastBlock: web3.eth.blockNumber,
    })

    return {tokenContract, account, tracker}
  },

  /**
   * Make new address
   *
   * @param password
   * @return {*}
   */
  getNewAddress (password) {
    return {
      address: web3.personal.newAccount(password),
      balance: 0,
      id: 0,
      unlocked: false,
    }
  },

  /**
   * Create tracker
   *
   * @return {*}
   */
  createTracker  () {
    return Object.assign({}, web3.zsl.GenerateZKeypair(), {
      id: 0,
      uuid: uuid.v4(),
      balance: 0,
      notes: [],
      spent: [],
      lastBlock: web3.eth.blockNumber,
    })
  },

  /**
   * Make transaction (TODO move to blockhacin service)
   *
   * @param txId
   * @param direction
   * @param amount
   * @param from
   * @param to
   * @param type
   * @param ts
   */
  makeTx (txId, direction, amount, from, to, type, ts = null) {
    const o = {}

    if (ts !== null) {
      const d = new Date(ts * 1000)
    } else {
      const d = new Date()
    }

    o.txId = txId
    o.direction = direction
    o.amount = amount
    o.from = from
    o.to = to
    o.type = type
    o.date =
      d.getUTCFullYear() + '-' +
      d.getUTCMonth() + 1 + '-' +
      d.getUTCDate() + ' ' +
      d.getUTCHours() + ':' +
      d.getUTCMinutes()

    return o
  },

  /**
   * Shield
   *
   * @param {BigNumber} amount
   * @param account
   * @param tracker
   * @param tokenContract
   */
  shield (amount, account, tracker, tokenContract) {
    return new Promise((resolve, reject) => {
      if (account.locked) {
        return reject(new Error('Selected account is locked'))
      }

      const balance = tokenContract.balanceOf(account.address)

      if (balance.isLessThan(amount)) {
        return reject(new Error('Not enough balance to shield'))
      }

      web3.eth.getGasPrice(function (err, res) {
        if (err) return reject(new Error('Error estimating gas costs:' + err))

        const totalGas = new BigNumber(config.unshieldGas * res)
        debug('Total shield cost is ' + web3.fromWei(totalGas, 'ether'))

        if (store.getters('general/tBalance').isLessThan(totalGas)) {
          return reject(new Error('Insufficient funds for gas + price'))
        }

        ztracker.shield(tokenContract, amount, account.address, tracker, function (err, result) {
          if (err) return reject(new Error(err))
          resolve(result)
        })
      })
    })
  },

  /**
   * Unshield
   *
   * @param amount
   * @param account
   * @param tracker
   * @return {Promise<any>}
   */
  unshield (amount, account, tracker) {
    return new Promise((resolve, reject) => {
      if (account.locked) {
        return reject(new Error('Selected account is locked'))
      }

      web3.eth.getGasPrice(function (err, res) {
        if (err) return reject(new Error('Error estimating gas costs:' + err))

        const totalGas = new BigNumber(config.unshieldGas * res)
        debug('Total unshield cost is ' + web3.fromWei(totalGas, 'ether'))

        if (store.getters('general/tBalance').isLessThan(totalGas)) {
          return reject(new Error('Insufficient funds for gas + price'))
        }

        // TODO not finished
      })
    })
  },
}
