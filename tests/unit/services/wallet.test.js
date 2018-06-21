import * as wallet from '../../../src/services/wallet'
import web3 from '../../../src/services/web3'

jest.mock('../../../src/services/web3')

describe('wallet.js service', () => {

  describe('getNewAddress',() => {

    it('should generate new address', (done) => {
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

})
