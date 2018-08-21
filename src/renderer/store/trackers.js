import {createTracker} from '../../services/tracker'
import co from 'co'
import {shield} from '../../services/wallet'
import moment from 'moment/moment'

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

  shield ({dispatch, commit, rootState, rootGetters}, {tracker, amount}) {
    return co(function* () {
      commit('START_LOADING')
      commit('SHIELD')

      const note = yield shield(rootGetters.currentAccount, rootGetters.glyBalance, amount, tracker, rootState.general.tokenContract)
      commit('SHIELD_OK', {tracker, note})
    }).catch(err => {
      commit('SHIELD_FAIL', err)
      throw err
    }).finally(() => {
      commit('STOP_LOADING')
    })
  },

  newShielding ({commit, dispatch, getters}, {block, event}) {
    commit('NEW_SHIELDING', {block, event})
    // Search all trackers for a note ("some" is used to stop searching right after note is found)
    let note
    const tracker = getters.currentTrackers.find(tracker => {
      let n = tracker.notes.find(note => note.txHash === event.transactionHash)
      if (n) {
        note = n
        return true
      }
      return false
    })
    if (! note) {
      commit('NEW_SHIELDING_FAIL', {block, event})
    } else {
      commit('NEW_SHIELDING_OK', {block, tracker, note})
      dispatch('glsTransfer', {block, tracker, note, type: 'shield'})
    }
  },
}

/*
 * Mutations
 */
const mutations = {

  CREATE_TRACKER () {},
  CREATE_TRACKER_OK (state, {account, tracker}) {
    state.trackers[account.address].push(tracker)
  },
  CREATE_TRACKER_FAIL () {},

  SHIELD (state) { },
  SHIELD_OK (state, {tracker, note}) {
    tracker.notes.push(note)
  },
  SHIELD_FAIL (state, error) {},

  UNSHIELD (state) {},
  UNSHIELD_OK (state, {tracker, note}) {},
  UNSHIELD_FAIL (state, error) {},

  NEW_SHIELDING (state) {},
  NEW_SHIELDING_FAIL (state, event) {},
  NEW_SHIELDING_OK (state, {block, tracker, note}) {
    note.confirmed = true
    note.date = moment.unix(block.timestamp)
    tracker.balance = tracker.balance.add(note.value)
  },
}

export default {
  state,
  getters,
  actions,
  mutations,
}
