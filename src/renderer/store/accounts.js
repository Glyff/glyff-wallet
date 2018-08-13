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

  selectAccountIfNotSelected ({commit, state}) {
    if (state.accounts.length) {
      commit('CHANGE_ACCOUNT', state.accounts[0])
    }
  },

  checkIfAccountsLocked ({commit, state}) {
    state.accounts.map(a => {
      isUnlocked(a).then(unlocked => {
        if (unlocked) commit('UNLOCK_ACCOUNT_OK', a)
        else commit('LOCK_ACCOUNT_OK', a)
      })
    })
  },

  unlockAccount ({commit}, {account, password}) {
    return co(function* () {
      commit('START_LOADING')
      commit('UNLOCK_ACCOUNT')
      yield web3.eth.personal.unlockAccount(account.address, password)
      commit('UNLOCK_ACCOUNT_OK', account)
    }).catch(e => {
      commit('UNLOCK_ACCOUNT_FAIL', e)
      throw e
    }).finally(() => commit('STOP_LOADING'))
  },

  lockAccount ({commit}, account) {
    return co(function* () {
      commit('LOCK_ACCOUNT')
      yield web3.eth.personal.lockAccount(account.address)
      commit('LOCK_ACCOUNT_OK', account)
    }).catch(e => {
      commit('LOCK_ACCOUNT_FAIL', e)
      throw e
    })
  },

  createAccount ({commit, dispatch}, {name, password}) {
    return co(function* () {
      commit('START_LOADING')
      commit('CREATE_ACCOUNT')
      const address = yield web3.eth.personal.newAccount(password)
      const account = {name, address}
      commit('CREATE_ACCOUNT_OK', account)
      yield dispatch('loadGlyBalance', account)
      const tracker = yield dispatch('createTracker', account)
      yield dispatch('checkPastEvents', {tracker, address})
    }).catch(err => {
      commit('CREATE_ACCOUNT_FAIL', err)
      throw err
    }).finally(() => commit('STOP_LOADING'))
  },

  updateAccount ({commit}, data) {
    commit('UPDATE_ACCOUNT_OK', data)
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
      commit('START_LOADING')
      commit('SEND_GLY')
      const atts = {
        from: state.selectedAddress,
        to: data.recipient,
        value: web3.utils.toWei(data.amount),
        gasPrice: data.gasPrice * 1000000000,
        gasLimit: '0x55f0', // // 22000 Wei
      }
      console.log(atts)
      const tx = yield web3.eth.sendTransaction(atts)
      console.log(tx)
      commit('SEND_GLY_OK', tx)
    }).catch(err => {
      commit('SEND_GLY_FAIL', err)
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

  CREATE_ACCOUNT (state) {
    //
  },

  CREATE_ACCOUNT_OK (state, account) {
    state.accounts.push(Object.assign({}, account, {locked: false}))
    state.selectedAddress = account.address
  },

  CREATE_ACCOUNT_FAIL (state, error) {
    //
  },

  UPDATE_ACCOUNT_OK (state, data) {
    state.accounts.find(a => a.address === data.address).name = data.name
  },

  CHANGE_ACCOUNT (state, account) {
    state.selectedAddress = account.address
  },

  LOCK_ACCOUNT (state, account) {
    //
  },

  LOCK_ACCOUNT_OK (state, {address}) {
    state.accounts.find(a => a.address.toLowerCase() === address.toLowerCase()).locked = true
  },

  LOCK_ACCOUNT_FAIL (state, account) {
    //
  },

  UNLOCK_ACCOUNT (state, account) {
    //
  },

  UNLOCK_ACCOUNT_OK (state, {address}) {
    const accIdx = state.accounts.findIndex(a => a.address.toLowerCase() === address.toLowerCase())
    Vue.set(state.accounts, accIdx, Object.assign(state.accounts[accIdx], {locked: false}))
  },

  UNLOCK_ACCOUNT_FAIL (state, account) {
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
}

export default {
  state,
  getters,
  actions,
  mutations,
}
