import BN from 'bn.js'
import {fromWei} from '../../services/web3'

/*
 * State
 */
const state = {
  accounts: [],
  selectedAccount: null,

  transactions: {},
}

/*
 * Getters
 */
const getters = {

  currentAccount (state) {
    if (! state.accounts.length) return null

    return state.accounts.find(a => a.address === state.selectedAccount)
  },

  currentAccountTransactions (state, getters) {
    if (! getters.currentAccount) return []

    return state.transactions[getters.currentAccount.address] || []
  },

  glyBalance (state, getters) {
    if (! getters.currentAccount) return new BN(0)

    return getters.calcBalance('GLY')
  },

  glxBalance (state, getters) {
    if (! getters.currentAccount) return new BN(0)

    return getters.calcBalance('GLX')
  },

  calcBalance: (state, getters) => (type) => {
    const address = getters.currentAccount.address
    let balance = new BN(0)
    getters.currentAccountTransactions.forEach(tx => {
      if (tx.type !== type) return
      if (tx.from === address) balance = balance.sub(tx.amount)
      if (tx.to === address) balance = balance.add(tx.amount)
    })

    return balance
  }
}

/*
 * Actions
 */
const actions = {

  // loadAccounts ({commit, state}) {
  //   return co(function* () {
  //     commit('LOAD_ACCOUNTS')
  //     const accounts = yield loadAccounts(config.homeDir)
  //     commit('LOAD_ACCOUNTS_OK', accounts)
  //     // Select first account
  //     if (typeof accounts[0] !== 'undefined' && ! state.selectedAccount) {
  //       commit('CHANGE_ACCOUNT', accounts[0])
  //     }
  //   }).catch(err => {
  //     commit('LOAD_ACCOUNTS_FAIL', err)
  //     throw err
  //   })
  // },

  glyTransfer ({commit, dispatch, getters}, tx) {
    commit('GLY_TRANSFER', tx)
    if (tx.direction === 'in') {
      dispatch('addToastMessage', {
        text: 'You just recieved ' + fromWei(tx.amount, tx.type) + ' ' + tx.type + ' from ' + tx.from,
        type: 'success',
      }, {root: true})
    }
  },

}

/*
 * Mutations
 */
const mutations = {

  // LOAD_ACCOUNTS (state) {
  //   //
  // },
  //
  // LOAD_ACCOUNTS_OK (state, accounts) {
  //   // Ensure that accounts have transactions array
  //   accounts = accounts.map(acc => {
  //     acc.transactions = acc.transactions || []
  //     return acc
  //   })
  //   state.accounts = accounts
  // },

  GLY_TRANSFER (state, tx) {
    const account = state.accounts.find(a => a.address.toLowerCase() === tx.from.toLowerCase() ||
      a.address.toLowerCase() === tx.to.toLowerCase())

    state.transactions[account.address].push(tx)
  },

  CHANGE_ACCOUNT (state, account) {
    state.selectedAccount = account.address
  },

}

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
}
