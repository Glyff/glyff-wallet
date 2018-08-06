import BN from 'bn.js'
import Vue from 'vue'
import co from 'co'
import web3, {fromWei, isUnlocked} from '../../services/web3'

/*
 * State
 */
const state = {
  /**
   * Account structure: {
   *   name: string,
   *   address: string,
   *   balance: string,
   *   locked: boolean,
   * }
   */
  accounts: [],

  selectedAddress: null,

  transactions: {},

  currentBlock: null,
  lastBlock: null,
  syncingBlock: null,

  showUnlock: false,
}

/*
 * Getters
 */
const getters = {

  currentAccount (state) {
    if (! state.accounts.length) return null

    return state.accounts.find(a => a.address === state.selectedAddress)
  },

  currentAccountTransactions (state, getters) {
    if (! state.selectedAddress) return []

    return state.transactions[state.selectedAddress] || []
  },

  glyBalance (state, getters) {
    if (! getters.currentAccount || ! getters.currentAccount.balance) return new BN(0)

    return getters.currentAccount.balance
  },

  glxBalance (state, getters) {
    if (! getters.currentAccount) return new BN(0)

    return getters.calcBalance('GLX')
  },

  calcBalance: (state, getters) => (type) => {
    const address = state.selectedAddress.toLowerCase()
    let balance = new BN(0)
    getters.currentAccountTransactions.forEach(tx => {
      if (tx.type !== type) return
      if (tx.from.toLowerCase() === address) balance = balance.sub(tx.amount)
      if (tx.to.toLowerCase() === address) balance = balance.add(tx.amount)
    })

    return balance
  },

}

/*
 * Actions
 */
const actions = {

  selectIfNotSelected ({commit, state}) {
    if (state.accounts.length) {
      commit('CHANGE_ACCOUNT', state.accounts[0])
    }
  },

  checkIfLocked ({commit, state}) {
    state.accounts.map(a => {
      isUnlocked(a).then(unlocked => {
        if (unlocked) commit('UNLOCK_OK', a)
        else commit('LOCK_OK', a)
      })
    })
  },

  unlock ({commit}, {account, password}) {
    return co(function* () {
      commit('UNLOCK')
      yield web3.eth.personal.unlockAccount(account.address, password)
      commit('UNLOCK_OK', account)
    }).catch(e => {
      commit('UNLOCK_FAIL', e)
      throw e
    })
  },

  lock ({commit}, account) {
    return co(function* () {
      commit('LOCK')
      yield web3.eth.personal.lockAccount(account.address)
      commit('LOCK_OK', account)
    }).catch(e => {
      commit('LOCK_FAIL', e)
      throw e
    })
  },

  create ({commit, dispatch}, {name, password}) {
    return co(function* () {
      commit('general/START_LOADING', null, {root: true})
      commit('CREATE')
      const address = yield web3.eth.personal.newAccount(password)
      const account = {name, address}
      commit('CREATE_OK', account)
      yield dispatch('loadGlyBalance', account)
      yield dispatch('trackers/create', account, {root: true})
      yield dispatch('general/checkPastEvents', null, {root: true})
    }).then(() => {
      commit('general/STOP_LOADING', null, {root: true})
    }).catch(err => {
      commit('CREATE_FAIL', err)
      throw err
    })
  },

  update ({commit}, data) {
    commit('UPDATE_OK', data)
  },

  loadGlyBalance ({commit}, {address}) {
    return co(function* () {
      commit('LOAD_GLY_BALANCE')
      commit('LOAD_GLY_BALANCE_OK', {address, balance: new BN(yield web3.eth.getBalance(address))})
    }).catch(err => commit('LOAD_GLY_BALANCE_FAIL', err))
  },

  glyTransfer ({commit, dispatch, getters}, tx) {
    commit('GLY_TRANSFER', tx)
    if (tx.direction === 'in') {
      dispatch('addToastMessage', {
        text: 'You just recieved ' + fromWei(tx.amount, tx.type) + ' ' + tx.type + ' from ' + tx.from,
        type: 'success',
      }, {root: true})
    }
  },

  glxTransfer ({commit, dispatch, getters}, tx) {
    commit('GLX_TRANSFER', tx)
    if (tx.direction === 'in') {
      dispatch('addToastMessage', {
        text: 'You just recieved ' + fromWei(tx.amount, tx.type) + ' ' + tx.type + ' from ' + tx.from,
        type: 'success',
      }, {root: true})
    }
  },

  sendGly ({commit, state}, data) {
    return co(function* () {
      commit('general/START_LOADING', null, {root: true})
      commit('SEND_GLY')
      const atts = {
        from: state.selectedAddress,
        to: data.recipient,
        value: web3.utils.toWei(data.amount),
        gasPrice: data.gasPrice * 1000000000,
        gasLimit: 21000,
      }
      console.log(atts)
      const tx = yield web3.eth.sendTransaction(atts)
      console.log(tx)
      commit('SEND_GLY_OK', tx)
    }).catch(err => {
      commit('SEND_GLY_FAIL', err)
      throw err
    }).finally(() => {
      commit('general/STOP_LOADING', null, {root: true})
    })
  },

}

/*
 * Mutations
 */
const mutations = {

  CREATE (state) {
    //
  },

  CREATE_OK (state, account) {
    state.accounts.push(Object.assign({}, account, {locked: false}))
    state.selectedAddress = account.address
  },

  CREATE_FAIL (state, error) {
    //
  },

  UPDATE_OK (state, data) {
    state.accounts.find(a => a.address === data.address).name = data.name
  },

  CHANGE_ACCOUNT (state, account) {
    state.selectedAddress = account.address
  },

  SHOW_UNLOCK (state) {
    state.showUnlock = true
  },

  HIDE_UNLOCK (state) {
    state.showUnlock = false
  },

  LOCK (state, account) {
    //
  },

  LOCK_OK (state, {address}) {
    state.accounts.find(a => a.address.toLowerCase() === address.toLowerCase()).locked = true
  },

  LOCK_FAIL (state, account) {
    //
  },

  UNLOCK (state, account) {
    //
  },

  UNLOCK_OK (state, {address}) {
    state.accounts.find(a => a.address.toLowerCase() === address.toLowerCase()).locked = false
  },

  UNLOCK_FAIL (state, account) {
    //
  },

  LOAD_GLY_BALANCE (state) {
    //
  },

  LOAD_GLY_BALANCE_OK (state, {address, balance}) {
    const idx = state.accounts.findIndex(a => a.address === address)
    if (idx !== - 1) {
      Vue.set(state.accounts, idx, Object.assign({}, state.accounts[idx], {balance}))
    }
  },

  LOAD_GLY_BALANCE_FAIL (state, error) {
    //
  },

  GLX_TRANSFER (state, tx) {
    const account = state.accounts.find(a => a.address.toLowerCase() === tx.from.toLowerCase() ||
      a.address.toLowerCase() === tx.to.toLowerCase())

    if (! state.transactions[account.address]) Vue.set(state.transactions, account.address, [])
    state.transactions[account.address].push(tx)
  },

  GLY_TRANSFER (state, tx) {
    const account = state.accounts.find(a => a.address.toLowerCase() === tx.from.toLowerCase() ||
      a.address.toLowerCase() === tx.to.toLowerCase())

    if (! state.transactions[account.address]) Vue.set(state.transactions, account.address, [])
    state.transactions[account.address].push(tx)
  },

  SEND_GLY (state) {
    //
  },

  SEND_GLY_OK (state, tx) {
    //
  },

  SEND_GLY_FAIL (state, err) {
    //
  },

  UPDATE_CURRENT_BLOCK (state, currentBlock) {
    state.currentBlock = currentBlock
    state.syncingBlock = null // Current block is updated after syncing is finished
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
  namespaced: true,
}
