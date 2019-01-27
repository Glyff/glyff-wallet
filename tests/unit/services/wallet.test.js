import * as wallet from '../../../src/services/wallet'
import web3, {connect, toWei} from '../../../src/services/web3'
import co from 'co'
import config from '../../config'
import appConfig from '../../../src/config'
import BN from 'bn.js'
import {createTracker} from '../../../src/services/tracker'
import debug from 'debug'

debug.log = console.log.bind(console)

describe('wallet.js service', () => {

  beforeAll(() => connect())

  describe('getNewAddress', () => {

    it('should generate new address', (done) => {
      jest.mock('../../../src/services/web3')
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

  describe('shield', () => {
    let tokenContract

    beforeAll(() => {
      tokenContract = new web3.eth.Contract(appConfig.token.abi, appConfig.token.address)
    })

    it('should have test address with sufficient balances', () => {
      return co(function *() {
        const glyBalance = new BN(yield web3.eth.getBalance(config.address))
        const glxBalance = new BN(yield tokenContract.methods.balanceOf(config.address).call())

        expect(glyBalance.gt(toWei(1, 'ETH'))).toBe(true)
        expect(glxBalance.gt(toWei(1, 'GLX'))).toBe(true)
      })
    })

    it('should shield successfully', () => {
      return co(function *() {
        const account = {
          name: 'test',
          address: config.address,
        }

        const tracker = yield createTracker()
        const glyBalance = new BN(yield web3.eth.getBalance(config.address))

        yield web3.eth.personal.unlockAccount(account.address, config.password, 9999)

        const note = yield wallet.shield(account, glyBalance, toWei(1, 'GLX'), tracker, tokenContract)

        console.log(note)

        // TODO watch for new transaction and check mined note
      })
    }, 300000)

  })

})
