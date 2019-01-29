import * as wallet from '../../src/services/wallet'
import web3, {connect, toWei} from '../../src/services/web3'
import co from 'co'
import config from '../config'
import appConfig from '../../src/config'
import BN from 'bn.js'
import {createTracker} from '../../src/services/tracker'

const debug = require('debug')('test')

describe('wallet.js', () => {

  beforeAll(() => connect())

  describe('getNewAddress', () => {

    it('should generate new address', (done) => {
      jest.mock('../../src/services/web3')
      web3.personal.newAccount.mockReturnValueOnce('theaddress')

      const address = wallet.getNewAddress('123123')
      expect(address).toEqual({
        address: 'theaddress',
        balance: 0,
        id: 0,
        unlocked: false,
      })
      done()
    })

  })

  describe('shield unshield', () => {
    const account = {
      name: 'test',
      address: config.address,
    }

    let tokenContract
    let note
    let tracker

    beforeAll(() => {
      tokenContract = new web3.eth.Contract(appConfig.token.abi, appConfig.token.address)
    })

    it('should have test address with sufficient balances', () => {
      return co(function *() {
        const glyBalance = new BN(yield web3.eth.getBalance(config.address))
        const glxBalance = new BN(yield tokenContract.methods.balanceOf(config.address).call())

        expect(glyBalance.gt(toWei(1, 'GLY'))).toBe(true)
        expect(glxBalance.gt(toWei(1, 'GLX'))).toBe(true)
      })
    })

    it('should shield successfully', (done) => {
      co(function *() {
        tracker = yield createTracker()

        const glyBalance = new BN(yield web3.eth.getBalance(config.address))

        yield web3.eth.personal.unlockAccount(account.address, config.password, 9999)

        note = yield wallet.shield(account, glyBalance, toWei(1, 'GLX'), tracker, tokenContract)

        debug('Yielded shield note', note)

        tokenContract.events.LogShielding((err, event) => {
          debug('Recieved LogShielding event')
          expect(err).toBeFalsy()
          expect(event.returnValues.from).toBe(account.address)
          expect(event.returnValues['2']).toBe(note.uuid)
          note.confirmed = true
          tracker.notes.push(note)
          tracker.balance = note.value
          done()
        })

        expect.assertions(3)
      })
    }, 300000)

    it('should unshield successfully', (done) => {
      co(function *() {
        const glyBalance = new BN(yield web3.eth.getBalance(config.address))

        const notes = yield wallet.unshield(account, glyBalance, toWei(1, 'GLX'), tracker, tokenContract)

        debug('Yielded unshield notes', notes)

        tokenContract.events.LogUnshielding((err, event) => {
          debug('Recieved LogUnshielding event')
          debug({err, event})

          expect(err).toBeFalsy()
          expect(event.returnValues.from).toBe(account.address)
          expect(event.returnValues['2']).toBe(note.uuid)
          done()
        })

        expect.assertions(3)
      })
    }, 600000)
  })

})
