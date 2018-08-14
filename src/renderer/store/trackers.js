import {createTracker} from '../../services/tracker'
import co from 'co'
import BN from 'bn.js'
import {shield} from '../../services/wallet'

/*
 * State
 */
const state = {

  trackers: {},

}

/*
 * Getters
 */
const getters = {

  currentTrackers (state, getters, rootState) {
    if (! rootState.accounts.selectedAddress) return []

    return state.trackers[rootState.accounts.selectedAddress]
  },

}

/*
 * Actions
 */
const actions = {

  glyShielding ({commit}, event) {
    commit('NEW_SHIELDING', event)
  },

  /**
   * Create a new tracker
   *
   * @param commit
   * @param account
   */
  createTracker ({commit}, account) {
    commit('START_LOADING')
    commit('CREATE_TRACKER')
    return createTracker().then(tracker => {
      commit('CREATE_TRACKER_OK', {account, tracker})
      return tracker
    }).catch(err => {
      commit('CREATE_TRACKER_FAIL', err)
    }).finally(() => {
      commit('STOP_LOADING')
    })
  },

  /**
   * Check if trackers exist and create if needed
   *
   * @param dispatch
   * @param state
   * @param rootState
   * @return {*}
   */
  checkAndCreateTrackers ({dispatch, state, rootState}) {
    return co(function* () {
      yield rootState.accounts.accounts.map(account => {
        if (! state.trackers[account.address] || state.trackers[account.address].length === 0) {
          return dispatch('createTracker', account)
        }
      })
    })
  },

  shield ({commit, rootState, rootGetters}, {tracker, amount}) {
    return co(function* () {
      amount = new BN(amount)
      commit('START_LOADING')
      commit('SHIELD')

      const note = yield shield(rootGetters.currentAccount, rootGetters.glyBalance, amount, tracker, rootState.general.tokenContract)
      console.log(note)
      commit('SHIELD_OK', note)
    }).catch(err => {
      commit('SHIELD_FAIL', err)
      throw err
    }).finally(() => {
      commit('STOP_LOADING')
    })
  },
}

/*
 * Mutations
 */
const mutations = {

  CREATE_TRACKER () {
    //
  },

  CREATE_TRACKER_OK (state, {account, tracker}) {
    state.trackers[account.address].push(tracker)
  },

  CREATE_TRACKER_FAIL () {
    //
  },

  SHIELD (state) {
    //
  },

  SHIELD_OK (state, event) {
    //
  },

  SHIELD_FAIL (state, error) {
    //
  },
}

export default {
  state,
  getters,
  actions,
  mutations,
}
