import co from 'co'
import BN from 'bn.js'
import {connect as web3Connect} from '../../services/web3'
import bus from '../bus'
import startup from '../../services/startup'
import {checkPastEvents} from '../../services/blockchain'

/*
 * State
 */
const state = {
  globalLoading: true,

  checkingPastEvents: true,

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
    if (! getters.currentAccount) return new BN(0)

    return getters.balanceForAddress(getters.currentAccount.address)
  },

  currentAccount (state) {
    if (! state.accounts.length) return null

    return state.accounts[state.selectedAcctIdx]
  },

  currentTracker (state) {
    if (! state.trackers.length) return null

    return state.trackers[state.selectedTrackerIdx]
  },

  balanceForAddress: state => address => {
    let balance = new BN(0)
    state.transactions.forEach(tx => {
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

  checkPastEvents ({commit, state, getters}) {
    commit('CHECK_PAST_EVENTS')

    return co(function* () {
      const data = yield checkPastEvents(bus, getters.currentTracker, state.accounts, state.tokenContract)
      commit('CHECK_PAST_EVENTS_OK', data)
    })
      .catch(error => {
        commit('CHECK_PAST_EVENTS_FAIL', error)
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

  CHECK_PAST_EVENTS (state) {
    state.checkingPastEvents = true
  },

  CHECK_PAST_EVENTS_OK (state) {
    state.checkingPastEvents = false
  },

  CHECK_PAST_EVENTS_FAIL (state, error) {
    state.checkingPastEvents = false
  },

}

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
}
