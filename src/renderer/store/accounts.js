import BN from 'bn.js'
import Vue from 'vue'
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
    if (! state.selectedAccount) return []

    return state.transactions[state.selectedAccount] || []
  },

  glyBalance (state, getters) {
    if (! state.selectedAccount) return new BN(0)

    return getters.calcBalance('GLY')
  },

  glxBalance (state, getters) {
    if (! getters.currentAccount) return new BN(0)

    return getters.calcBalance('GLX')
  },

  calcBalance: (state, getters) => (type) => {
    const address = state.selectedAccount
    let balance = new BN(0)
    getters.currentAccountTransactions.forEach(tx => {
      if (tx.type !== type) return
      if (tx.from === address) balance = balance.sub(tx.amount)
      if (tx.to === address) balance = balance.add(tx.amount)
    })

    return balance
  },

}

/*
 * Actions
 */
const actions = {

  selectIfNotSelected ({commit, state}) {
    if (state.accounts.length) {
      commit('CHANGE_ACCOUNT', state.accounts[0])
    }
  },

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

  GLY_TRANSFER (state, tx) {
    const account = state.accounts.find(a => a.address.toLowerCase() === tx.from.toLowerCase() ||
      a.address.toLowerCase() === tx.to.toLowerCase())

    if (! state.transactions[account.address]) Vue.set(state.transactions, account.address, [])
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
