import {createTracker} from '../../services/tracker'

/*
 * State
 */
const state = {
  trackers: [],
}

/*
 * Getters
 */
const getters = {

  currentTracker (state, getters, rootState) {
    if (! state.trackers.length) return null

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

  createTracker ({commit}, account) {
    commit('CREATE_TRACKER')
    createTracker().then(tracker => {
      commit('CREATE_TRACKER_OK', {account, tracker})
    })
  }

}

/*
 * Mutations
 */
const mutations = {

  CREATE_TRACKER () {
    //
  },

  CREATE_TRACKER_OK (state, {account, tracker}) {
    state.trackers[account.address] = tracker
  },

  LOAD_TRACKERS_OK (state, trackers) {
    state.trackers = trackers
  },

  LOAD_TRACKERS_FAIL (state, error) {
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
