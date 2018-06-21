import co from 'co'
import BigNumber from 'bignumber.js'
import {connect as web3Connect} from '../../services/web3'
import startup from '../../services/startup'

/*
 * State
 */
const state = {
  globalLoading: true,

  appStarting: true,
  startError: null,
  connectionError: null,

  installation: false,
  filesCorrupted: false,

  oToken: null,
  tokenContract: null,

  accounts: [], // Accounts list
  stBuffer: [],
  notesBuffer: [],
  transactions: [],
  trackers: [],

  selectedAcctIdx: 0,
  selectedTrackerIdx: 0,

  tBalance: 0,
  sBalance: 0,
}

/*
 * Getters
 */
const getters = {

  tBalance (state, getters) {
    if (! getters.selectedAccount) return new BigNumber(0)

    return getters.balanceForAddress(getters.selectedAccount.address)
  },

  selectedAccount (state) {
    if (! state.accounts.length) return null

    return state.accounts[state.selectedAcctIdx]
  },

  balanceForAddress: state => address => {
    let balance = new BigNumber(0)
    state.transactions.forEach(tx => {
      if (tx.from === address) balance = balance.minus(tx.amount)
      if (tx.to === address) balance = balance.plus(tx.amount)
    })

    return balance
  },

}

/*
 * Actions
 */
const actions = {

  connect ({commit, dispatch}) {
    commit('CONNECT')

    return co(function* () {
      let connected = false
      while (! connected) {
        try {
          yield web3Connect()
          commit('CONNECT_OK')
          connected = true
        } catch (e) {
          commit('CONNECT_FAIL', 'Could not connect to the node, retrying..')
          yield new Promise(resolve => setTimeout(resolve, 3000)) // Just wait 3 seconds
        }
      }
    })
  },

  start ({commit}) {
    commit('START')

    return co(function* () {
      // Use startup service
      const data = yield startup()
      commit('START_OK', data)
    })
      .catch(error => {
        commit('START_FAIL', error)
        throw error // Re-trow exception to let it be caught globally
      })
  },

}

/*
 * Mutations
 */
const mutations = {

  START (state) {
    state.appStarting = true
    state.globalLoading = true
  },

  START_OK (state, data) {
    state = Object.assign(state, data)
    state.appStarting = false
    state.globalLoading = false
  },

  START_FAIL (state, error) {
    state.appStarting = false
    state.globalLoading = false
    state.startError = error
  },

  CONNECT (state) {
    state.globalLoading = true
  },

  CONNECT_OK (state) {
    state.connectionError = null
    state.globalLoading = false
  },

  CONNECT_FAIL (state, error) {
    state.connectionError = error
  },

}

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
}
