import startup from '../../../services/startup'

const state = {
  globalLoading: true,

  appStarting: true,
  startError: null,
  installation: false,
  filesCorrupted: false,

  tBalance: 0,
  sBalance: 0,

  selectedAcct: 0,
  selectedTracker: 0,

  trackers: [],

  oToken: null,
  tokenContract: null,

  accounts: [], // Accounts list
  stBuffer: [],
  notesBuffer: [],
  tmpTxs: [],
}

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
}

const actions = {
  start ({commit}) {
    commit('START')

    // Use startup service
    startup()
      .then(data => commit('START_OK', data))
      .catch(error => commit('START_FAIL', error))
  }
}

export default {
  state,
  mutations,
  actions,
  namespaced: true,
}
