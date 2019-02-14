import co from 'co'
import web3, {connect as web3Connect} from '../../services/web3'
import bus from '../bus'
import {checkPastEvents, syncChain, syncChainHeuristic, watchEvents, watchNewBlocks} from '../../services/blockchain'
import config from '../../config'

/*
 * State
 */
const state = {
  globalLoading: true,

  checkingPastEvents: true,

  appStarting: true,
  startError: null,
  connectionError: null,

  oToken: config.token,
  tokenContract: null,

  currentBlock: null,
  lastBlock: null,
  syncing: false,
  syncingBlock: null,

  showUnlock: false,
  showNewAccount: false,
}

/*
 * Getters
 */
const getters = {

  //

}

/*
 * Actions
 */
const actions = {

  /**
   * Connect to web3
   */
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
          const text = 'Could not connect to the node, retrying...'
          commit('CONNECT_FAIL', text)
          dispatch('addToastMessage', {text, type: 'danger'})
          yield new Promise(resolve => setTimeout(resolve, 3000)) // Just wait 3 seconds
        }
      }
    })
  },

  /**
   * Perform app start sequence
   */
  start ({commit, dispatch, state, rootState}) {
    commit('START')

    return co(function* () {
      yield dispatch('connect')
      commit('SET_TOKEN_CONTRACT')
      commit('UPDATE_LAST_BLOCK', yield web3.eth.getBlockNumber())
      dispatch('selectAccountIfNotSelected')
      dispatch('checkIfAccountsLocked') // Don't wait
      yield dispatch('checkAndCreateTrackers')
      commit('ENSURE_TRANSACTIONS_OBJECTS')
      rootState.accounts.accounts.forEach(account => dispatch('loadGlyBalance', account))
      rootState.accounts.accounts.forEach(account => dispatch('loadGlxBalance', account))

      commit('START_OK')

      // Check past events
      yield dispatch('checkPastEvents')

      if (rootState.accounts.accounts.length) {
        if (state.currentBlock === null) {
          // Use heuristic chain sync for initial syncing or normal for consecutive syncs
          yield dispatch('syncChainHeuristic')
        } else if (state.currentBlock !== state.lastBlock) {
          // Use noraml method to sync block between last block and current blocks
          yield dispatch('syncChain')
        }
      }

      watchNewBlocks(bus, rootState.accounts.accounts, rootState.accounts.transactions)
      watchEvents(bus, rootState.trackers.trackers, rootState.accounts.accounts, rootState.accounts.transactions, state.tokenContract)
    })
      .catch(error => {
        commit('START_FAIL', error)
        throw error // Re-trow exception to let it be caught globally
      })
  },

  syncChainHeuristic ({commit, rootState}) {
    return co(function* () {
      commit('SYNC_HEURISTIC_START')
      const currentBlock = yield syncChainHeuristic(bus, rootState.accounts.accounts, rootState.accounts.transactions)
      commit('SYNC_FINISH', currentBlock)
    })
  },

  syncChain ({commit, rootState}) {
    return co(function* () {
      commit('SYNC_START')
      const currentBlock = yield syncChain(bus, rootState.accounts.accounts, rootState.accounts.transactions, rootState.general.currentBlock)
      commit('SYNC_FINISH', currentBlock)
    })
  },

  /**
   * Check past events
   */
  checkPastEvents ({commit, state, rootState}) {
    return co(function* () {
      commit('CHECK_PAST_EVENTS')
      yield checkPastEvents(bus, rootState.trackers.trackers, rootState.accounts.accounts, rootState.accounts.transactions, state.tokenContract, state.currentBlock)
      commit('CHECK_PAST_EVENTS_OK')
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

  START_LOADING (state) {
    state.globalLoading = true
  },

  STOP_LOADING (state) {
    state.globalLoading = false
  },

  START (state) {
    state.appStarting = true
    state.globalLoading = true
  },

  START_OK (state, data) {
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

  UPDADE_OTOKEN (state, oToken) {
    state.oToken = oToken
  },

  SET_TOKEN_CONTRACT (state) {
    state.tokenContract = Object.freeze(new web3.eth.Contract(Object.assign([], state.oToken.abi), state.oToken.address))
  },

  SHOW_UNLOCK (state) {
    state.showUnlock = true
  },

  HIDE_UNLOCK (state) {
    state.showUnlock = false
  },

  SHOW_NEW_ACCOUNT (state) {
    state.showNewAccount = true
  },

  HIDE_NEW_ACCOUNT (state) {
    state.showNewAccount = false
  },

  SYNC_HEURISTIC_START (state) {
    state.syncing = true
  },

  SYNC_START (state, startFrom) {
    state.syncing = true
    state.syncingBlock = startFrom
  },

  SYNC_FINISH (state, currentBlock) {
    state.syncing = false
    state.currentBlock = currentBlock
    state.syncingBlock = null // Current block is updated after syncing is finished
  },

  NEW_BLOCK (state, newBlock) {
    state.currentBlock = newBlock.number
    state.lastBlock = newBlock.number
  },

  UPDATE_LAST_BLOCK (state, lastBlock) {
    state.lastBlock = lastBlock
  },

  UPDADE_SYNCING_BLOCK (state, syncingBlock) {
    state.syncingBlock = syncingBlock
  },

}

export default {
  state,
  getters,
  actions,
  mutations,
}
