import BN from 'bn.js'
import Vue from 'vue'
import co from 'co'
import web3, {fromWei, isUnlocked} from '../../services/web3'
import {createGlxTransaction, createGlyTransaction} from '../../services/transaction'

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
    if (! getters.currentAccount || ! getters.currentAccount.glxBalance) return new BN(0)

    return getters.currentAccount.glxBalance
  },

  calcBalance: (state, getters) => (type) => {
    let balance = new BN(0)
    getters.currentAccountTransactions.forEach(tx => {
      if (tx.type !== type) return
      if (tx.from === state.selectedAddress) balance = balance.sub(tx.value)
      if (tx.to === state.selectedAddress) balance = balance.add(tx.value)
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

  loadGlxBalance ({commit, rootState}, {address}) {
    return co(function* () {
      commit('LOAD_GLX_BALANCE')
      const glxBalance = new BN(yield rootState.general.tokenContract.methods.balanceOf(address).call())
      commit('LOAD_GLX_BALANCE_OK', {address, glxBalance})
    }).catch(err => commit('LOAD_GLX_BALANCE_FAIL', err))
  },

  glyTransfer ({commit, dispatch, state}, tx) {
    commit('GLY_TRANSFER', tx)
    if (state.accounts.find(a => a.address === tx.to)) {
      dispatch('addToastMessage', {
        text: 'You just recieved ' + fromWei(tx.value, tx.type) + ' ' + tx.type + ' from ' + tx.from,
        type: 'success',
      })
    }
  },

  glxTransfer ({commit, dispatch, state}, tx) {
    commit('GLX_TRANSFER', tx)
    if (state.accounts.find(a => a.address === tx.to)) {
      dispatch('addToastMessage', {
        text: 'You just recieved ' + fromWei(tx.value, tx.type) + ' ' + tx.type + ' from ' + tx.from,
        type: 'success',
      })
    }
  },

  sendGly ({commit, state, getters, dispatch}, data) {
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
      tx.value = web3.utils.toWei(data.amount)
      console.log(tx)
      commit('SEND_GLY_OK', tx)
      dispatch('glyTransfer', tx)
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

  ENSURE_TRANSACTIONS_OBJECTS (state) {
    state.accounts.forEach(a => {
      if (! state.transactions[a.address]) {
        state.transactions[a.address] = []
      }
    })
  },

  CREATE_ACCOUNT (state) {
    //
  },

  CREATE_ACCOUNT_OK (state, account) {
    state.accounts.push(Object.assign({}, account, {locked: false}))
    state.selectedAddress = account.address
    state.transactions[account.address] = []
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

  LOAD_GLY_BALANCE (state) {},
  LOAD_GLY_BALANCE_OK (state, {address, balance}) {
    const idx = state.accounts.findIndex(a => a.address === address)
    if (idx !== - 1) {
      Vue.set(state.accounts, idx, Object.assign({}, state.accounts[idx], {balance}))
    }
  },
  LOAD_GLY_BALANCE_FAIL (state, error) {},

  LOAD_GLX_BALANCE (state) {},
  LOAD_GLX_BALANCE_OK (state, {address, glxBalance}) {
    const idx = state.accounts.findIndex(a => a.address === address)
    if (idx !== - 1) {
      Vue.set(state.accounts, idx, Object.assign({}, state.accounts[idx], {glxBalance}))
    }
  },
  LOAD_GLX_BALANCE_FAIL (state, error) {},

  GLX_TRANSFER (state, tx) {
    tx = createGlxTransaction(tx)
    const fromAccount = state.accounts.find(a => a.address === tx.from)
    const toAccount = state.accounts.find(a => a.address === tx.to)

    if (fromAccount) {
      state.transactions[fromAccount.address].push(Object.assign({}, tx, {direction: 'out'}))
    }

    if (toAccount) {
      state.transactions[toAccount.address].push(Object.assign({}, tx, {direction: 'in'}))
    }
  },

  GLY_TRANSFER (state, tx) {
    tx = createGlyTransaction(tx)
    const fromAccount = state.accounts.find(a => a.address === tx.from)
    const toAccount = state.accounts.find(a => a.address === tx.to)

    if (fromAccount) {
      state.transactions[fromAccount.address].push(Object.assign({}, tx, {direction: 'out'}))
      // fromAccount.balance = fromAccount.balance.sub(tx.value)
    }

    if (toAccount) {
      state.transactions[toAccount.address].push(Object.assign({}, tx, {direction: 'in'}))
      // toAccount.balance = toAccount.balance.add(tx.value)
    }
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
