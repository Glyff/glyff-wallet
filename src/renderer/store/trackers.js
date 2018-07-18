import co from 'co'
import {loadTrackers} from '../../services/tracker'
import config from '../../config'

/*
 * State
 */
const state = {
  trackers: [],
  selectedTracker: 0,
  zBalance: [],
}

/*
 * Getters
 */
const getters = {

  currentTracker (state) {
    if (! state.trackers.length) return null

    return state.trackers[state.selectedTracker]
  },

}

/*
 * Actions
 */
const actions = {

  loadTrackers ({commit}) {
    return co(function* () {
      commit('LOAD_TRACKERS')
      commit('LOAD_TRACKERS_OK', yield loadTrackers(config.homeDir))
    }).catch(err => {
      commit('LOAD_TRACKERS_FAIL', err)
      throw err
    })
  },

  glyShielding ({commit}, event) {
    commit('NEW_SHIELDING', event)
  },

}

/*
 * Mutations
 */
const mutations = {

  LOAD_TRACKERS (state) {
    //
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
