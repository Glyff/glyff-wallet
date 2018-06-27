export default class WalletError extends Error {
  constructor (message, code) {
    super(message)
    this.code = code
  }
}
