export class NoteError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
  }
}
