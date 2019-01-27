import BN from 'bn.js'
import * as note from '../../../src/services/note'
import NoteError from '../../../src/errors/note-error'

describe('note.js service', () => {

  describe('searchUTXO', () => {

    it('should find exact match', () => {
      const notes = [
        {
          account: '1',
          value: new BN(1)
        },
        {
          account: '2',
          value: new BN(2)
        }
      ]

      expect(note.searchUTXO(notes, new BN(2))).toEqual({
        notes: [notes[1]],
        value: new BN(2),
      })
    })

    it('should find bigger match', () => {
      const notes = [
        {
          account: '1',
          value: new BN(4)
        },
        {
          account: '2',
          value: new BN(3)
        }
      ]

      expect(note.searchUTXO(notes, new BN(2))).toEqual({
        notes: [notes[1]],
        value: new BN(3),
      })
    })

    it('should find notes sum match', () => {
      const notes = [
        {
          account: '1',
          value: new BN(3)
        },
        {
          account: '2',
          value: new BN(4)
        }
      ]

      expect(note.searchUTXO(notes, new BN(7))).toEqual({
        notes: notes,
        value: new BN(7),
      })
    })

    it('should throw if cant find needed notes total', () => {
      const notes = [
        {
          account: '1',
          value: new BN(3)
        },
        {
          account: '2',
          value: new BN(4)
        }
      ]

      expect(() => note.searchUTXO(notes, new BN(9))).toThrow(NoteError)
    })

  })

})
