import {createTracker} from '../../services/tracker'
import co from 'co'
import {shield, unshield, sendShielded} from '../../services/wallet'
import moment from 'moment/moment'
import isArray from 'lodash-es/isArray'
import truncate from 'lodash-es/truncate'

/*
 * State
 */
const state = {

  trackers: {},

  // Pending sent notes temporary data (TODO)
  sentNotes: [],

}

/*
 * Getters
 */
const getters = {

  currentTrackers (state, getters, rootState) {
    if (! rootState.accounts.selectedAddress) return []

    return state.trackers[rootState.accounts.selectedAddress] || []
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

  unshield ({dispatch, commit, rootState, rootGetters}, {tracker, amount}) {
    return co(function* () {
      commit('START_LOADING')
      commit('UNSHIELD')

      const {removedNotes, addedNotes} = yield unshield(rootGetters.currentAccount, rootGetters.glyBalance, amount, tracker, rootState.general.tokenContract)
      commit('UNSHIELD_OK', {tracker, removedNotes, addedNotes})
    }).catch(err => {
      commit('UNSHIELD_FAIL', err)
      throw err
    }).finally(() => {
      commit('STOP_LOADING')
    })
  },

  sendShielded ({dispatch, commit, rootState, rootGetters}, {tracker, amount, zaddress}) {
    return co(function* () {
      commit('START_LOADING')
      commit('SEND_SHIELDED')

      const note = yield sendShielded(rootGetters.currentAccount, rootGetters.glyBalance, amount, zaddress, tracker, rootState.general.tokenContract)
      commit('SEND_SHIELDED_OK', {tracker, note})
    }).catch(err => {
      commit('SEND_SHIELDED_FAIL', err)
      throw err
    }).finally(() => {
      commit('STOP_LOADING')
    })
  },

  newShielding ({commit, dispatch, state}, {block, event, tracker, note}) {
    // commit('NEW_SHIELDING', {block, event})
    commit('NEW_SHIELDING_OK', {block, tracker, note})
    dispatch('glsTransfer', {block, tracker, note, type: 'shield'})

    dispatch('addToastMessage', {
      text: 'Shielding of ' + note.value.toString() + ' ATU for address ' + truncate(tracker.zaddr, {length: 10}) + ' was confirmed',
      type: 'success',
    })
  },

  newUnshielding ({commit, dispatch, state}, {block, event, tracker, note}) {
    // commit('NEW_UNSHIELDING', {block, event})
    commit('NEW_UNSHIELDING_OK', {block, tracker, note})
    dispatch('glsTransfer', {block, tracker, note, type: 'unshield'})

    dispatch('addToastMessage', {
      text: 'Unshielding of ' + note.value.toString() + ' ATU for address ' + truncate(tracker.zaddr, {length: 10}) + ' was confirmed',
      type: 'success',
    })
  },

  newShieldedTransfer ({commit, dispatch, state}, {block, event, tracker, note}) {
    commit('NEW_SHIELDED_TRANSFER_OK', {block, tracker, note})
    dispatch('glsTransfer', {block, tracker, note, type: 'transfer'})

    dispatch('addToastMessage', {
      text: 'Shielded transfer of ' + note.value.toString() + ' ATU for address ' + truncate(tracker.zaddr, {length: 10}) + ' was confirmed',
      type: 'success',
    })
  },
}

/*
 * Mutations
 */
const mutations = {

  CREATE_TRACKER () {},
  CREATE_TRACKER_OK (state, {account, tracker}) {
    if (! isArray(state.trackers[account.address])) state.trackers[account.address] = []

    state.trackers[account.address].push(tracker)
  },
  CREATE_TRACKER_FAIL () {},

  SHIELD (state) { },
  SHIELD_OK (state, {tracker, note}) {
    tracker.notes.push(note)
  },
  SHIELD_FAIL (state, error) {},

  UNSHIELD (state) {},
  UNSHIELD_OK (state, {tracker, removedNotes, addedNotes}) {
    if (removedNotes.length) {
      tracker.notes.forEach(note => {
        if (removedNotes.find(rm => rm.uuid === note.uuid)) note.confirmed = false
      })
    }
    if (addedNotes.length) tracker.notes.concat(addedNotes)
  },
  UNSHIELD_FAIL (state, error) {},

  SEND_SHIELDED (state) {},
  SEND_SHIELDED_OK (state, {tracker, removedNotes, addedNotes}) {
    // TODO
  },
  SEND_SHIELDED_FAIL (state, error) {},

  NEW_SHIELDING (state) {},
  NEW_SHIELDING_FAIL (state, event) {},
  NEW_SHIELDING_OK (state, {block, tracker, note}) {
    note.confirmed = true
    note.date = moment.unix(block.timestamp)
    tracker.balance = tracker.balance.add(note.value)
  },

  NEW_UNSHIELDING (state) {},
  NEW_UNSHIELDING_FAIL (state, event) {},
  NEW_UNSHIELDING_OK (state, {block, tracker, note}) {
    tracker.notes.splice(tracker.notes.findIndex(n => n.uuid === note.uuid), 1)
    tracker.spent.push(note)
    tracker.balance = tracker.balance.sub(note.value)
  },

  NEW_SHIELDED_TRANSFER (state) {},
  NEW_SHIELDED_TRANSFER_FAIL (state, event) {},
  NEW_SHIELDED_TRANSFER_OK (state, {block, tracker, note}) {
    tracker.notes.push(note)
    tracker.balance = tracker.balance.add(note.value)
  },
}

export default {
  state,
  getters,
  actions,
  mutations,
}
