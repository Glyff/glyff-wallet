import co from 'co'
import web3, {connect as web3Connect} from '../../services/web3'
import bus from '../bus'
import {checkPastEvents} from '../../services/blockchain'
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

  createAccount: false,

  oToken: config.token,
  tokenContract: new web3.eth.Contract(config.token.abi, config.token.address),
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
   *
   * @param commit
   * @param dispatch
   * @return {*}
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
          commit('CONNECT_FAIL', 'Could not connect to the node, retrying..')
          yield new Promise(resolve => setTimeout(resolve, 3000)) // Just wait 3 seconds
        }
      }
    })
  },

  /**
   * Perform app start sequence
   *
   * @param commit
   * @param dispatch
   * @return {*}
   */
  start ({commit, dispatch}) {
    commit('START')

    return co(function* () {
      // Use startup service
      commit('START_OK')
    })
      .catch(error => {
        commit('START_FAIL', error)
        throw error // Re-trow exception to let it be caught globally
      })
  },

  /**
   * Check past events
   *
   * @param commit
   * @param state
   * @param rootState
   * @param getters
   * @param rootGetters
   * @return {*}
   */
  checkPastEvents ({commit, state, rootState, getters, rootGetters}) {
    commit('CHECK_PAST_EVENTS')

    return co(function* () {
      yield checkPastEvents(bus, rootGetters['trackers/currentTracker'], rootState.accounts.accounts, state.tokenContract)
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

}

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
}
