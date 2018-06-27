import BigNumber from 'bignumber.js'
import * as note from '../../../src/services/note'
import NoteError from '../../../src/errors/note-error'

describe('note.js service', () => {

  describe('searchUTXO',() => {

    it('should find exact match', () => {
      const notes = [
        {
          account: '1',
          value: new BigNumber(0.1)
        },
        {
          account: '2',
          value: new BigNumber(0.2)
        }
      ]

      expect(note.searchUTXO(notes, new BigNumber(0.2))).toEqual({
        utxos: [notes[1]],
        value: new BigNumber(0.2),
      })
    })

    it('should find bigger match', () => {
      const notes = [
        {
          account: '1',
          value: new BigNumber(0.4)
        },
        {
          account: '2',
          value: new BigNumber(0.3)
        }
      ]

      expect(note.searchUTXO(notes, new BigNumber(0.2))).toEqual({
        utxos: [notes[1]],
        value: new BigNumber(0.3),
      })
    })

    it('should find bigger match', () => {
      const notes = [
        {
          account: '1',
          value: new BigNumber(0.3)
        },
        {
          account: '2',
          value: new BigNumber(0.4)
        }
      ]

      expect(note.searchUTXO(notes, new BigNumber(0.6))).toEqual({
        utxos: notes,
        value: new BigNumber(0.7),
      })
    })

    it('should throw if cant find needed notes total', () => {
      const notes = [
        {
          account: '1',
          value: new BigNumber(0.3)
        },
        {
          account: '2',
          value: new BigNumber(0.4)
        }
      ]

      expect(() => note.searchUTXO(notes, new BigNumber(0.9))).toThrow(NoteError)
    })

  })

})
