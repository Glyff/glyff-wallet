import {createTracker} from '../../services/tracker'
import co from 'co'
import Vue from 'vue'

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

  currentTracker (state, getters, rootState) {
    if (! rootState.accounts.selectedAccount) return null

    return state.trackers[rootState.accounts.selectedAccount]
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
  create ({commit}, account) {
    commit('CREATE')
    return createTracker().then(tracker => {
      commit('CREATE_OK', {account, tracker})
      return tracker
    }).catch(err => {
      commit('CREATE_FAIL', err)
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
        if (! state.trackers[account.address]) {
          return dispatch('create', account)
        }
      })
    })
  },
}

/*
 * Mutations
 */
const mutations = {

  CREATE () {
    //
  },

  CREATE_OK (state, {account, tracker}) {
    Vue.set(state.trackers, account.address, tracker)
  },

  CREATE_FAIL () {
    //
  },

  NEW_SHIELDING (state, event) {
    //
  },

}

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
}