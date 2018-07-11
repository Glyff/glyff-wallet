
export const syncChain = () => {
  // TODO
}

function checkPastEvents (tokenContract) {
  var events = tokenContract.allEvents({fromBlock: trackers[selectedTracker].lastBlock, toBlock: 'latest'})

  events.get(function (error, logs) {
    if (! error) {
      for (var i = 0; i < logs.length; i++) {
        if (logs[i].event == 'LogShielding') {
          // Loop through all accounts
          for (var x = 0; x < accounts.length; x++) {
            // Loop thru all trackers
            for (var y = 0; y < trackers.length; y++) {
              // check all notes
              for (var z = 0; z < notesBuffer.length; z++) {
                // if shielding belongs to wallet
                if (logs[i].args.from.toString().localeCompare(accounts[x].address.toString()) == 0 && ! trackers[y].notes[z].confirmed) {
                  // if note is already in buffer
                  if (notesBuffer[z].uuid == logs[i].args.uuid) {
                    console.log(' Missed shielding event : \n' + JSON.stringify(logs[i]))

                    var note = notesBuffer[z]
                    note.confirmed = true

                    notesBuffer.splice(z, 1)

                    saveFile(p + 'cache.json', JSON.stringify(notesBuffer))
                    consolidateNote(note)
                  }
                }
              }
            }
          }
        } else if (logs[i].event == 'LogUnshielding') {
          // Loop through all accounts
          for (var x = 0; x < accounts.length; x++) {
            // if unshielding belongs to wallet
            if (logs[i].args.from.toString().localeCompare(accounts[x].address.toString()) == 0) {
              // Loop thru all trackers
              for (var y = 0; y < trackers.length; y++) {
                for (var z = 0; z < trackers[y].notes.length; z++) {
                  if (logs[i].args.uuid.toString().localeCompare(trackers[y].notes[z].uuid.toString()) == 0 && ! trackers[y].notes[z].confirmed) {
                    console.log(' Found missed unshielding event : \n' + JSON.stringify(logs[i]))

                    var note = notesBuffer[z]
                    note.confirmed = true

                    trackers[y].spent[logs[i].args.uuid.toString()] = note
                    trackers[y].notes = trackers[y].notes.filter(function (obj) {
                      return obj.uuid !== logs[i].args.uuid
                    })

                    spendNote(note)
                  }
                }
              }
            }
          }
        } else if (logs[i].event == 'LogShieldedTransfer') {
          for (var y = 0; y < trackers.length; y++) {
            decryptBlob(y, logs[i])
          }

          // Loop through all accounts
          for (var x = 0; x < accounts.length; x++) {
            // if shielded transfer belongs to wallet
            if (logs[i].args.from.toString().localeCompare(accounts[x].address.toString()) == 0) {
              // check all notes
              for (var z = 0; z < stBuffer.length; z++) {
                if (stBuffer[z] !== null && typeof stBuffer[z] === 'object') {
                  if (stBuffer[z].n1.uuid == logs[i].args.uuid_1) { // && stBuffer[z].n2.uuid == logs[i].args.uuid_2
                    console.log(' Found missed shielded transfer event : \n' + JSON.stringify(logs[i]))

                    o = stBuffer[z]

                    if (! _.isEmpty(o.n2)) {
                      o.n2.confirmed = true
                      trackers[o.n2.tracker].notes[logs[i].args.uuid_2] = o.n2
                    }

                    delete stBuffer[z]
                    saveFile(p + 'scache.json', JSON.stringify(stBuffer))

                    // console.log("buf is : " + JSON.stringify(o));

                    // Input note is spent.
                    trackers[o.n.tracker].spent[logs[i].args.uuid] = o.n
                    trackers[o.n.tracker].notes = trackers[o.n.tracker].notes.filter(function (obj) {
                      return obj.uuid !== o.n.uuid
                    })

                    spendNoteWithChange(o)
                  }
                }
              }
            }
          }
        }
      }
    } else {
      console.log('error getting events log')
    }
  })
}

function watchToken (tokenContract) {
  const logShieldingEvent = tokenContract.LogShielding()
  const logUnshieldingEvent = tokenContract.LogUnshielding()
  const logShieldedTransfer = tokenContract.LogShieldedTransfer()

  logShieldingEvent.watch(function (error, result) {
    if (! error) {
      if (result.event == 'LogShielding') {
        var found = false
        var note = null

        console.log(JSON.stringify(notesBuffer))

        for (var i = 0; i < notesBuffer.length; i++) {
          if ((notesBuffer[i].uuid.toString()).localeCompare(result.args.uuid.toString()) == 0) {
            note = notesBuffer[i]
            notesBuffer.splice(i, 1)
            saveFile(p + 'cache.json', JSON.stringify(notesBuffer))

            trackers[note.tracker].notes[result.args.uuid] = note

            note.confirmed = true
            found = true
          }
        }

        if (found) {
          console.log('[*] Shielding ' + result.args.uuid + ' added to z-contract.')
          console.log('******************************************************************************************************************************')

          // console.log("note is \n " +  JSON.stringify(note) +
          //            " \n Id : "   +  result.args.uuid);

          _consolidateNote(trackers[note.tracker].id, note, result)

          if (shieldBgTaskInProgress) {
            shieldBgTaskInProgress = false
          }
        }
      } else {
        console.log(error)
      }
    }
  })

  logUnshieldingEvent.watch(function (error, result) {
    var found = false

    if (! error) {
      if (result.event == 'LogUnshielding') {
        console.log(JSON.stringify(result))
        var note = null

        for (var y = 0; y < trackers.length; y++) {
          for (var i = 0; i < trackers[y].notes.length; i++) {
            if (trackers[y].notes[i].uuid == result.args.uuid) {
              note = trackers[y].notes[i]
              found = true
            }
          }
        }

        if (found) {
          console.log('[*] Unshielding ' + result.args.uuid + ' added to z-contract.')
          console.log('******************************************************************************************************************************')

          // console.log("note is \n " +  JSON.stringify(note) +
          //            " \n Id : "   +  result.args.uuid);

          trackers[note.tracker].spent[result.args.uuid] = note
          trackers[note.tracker].notes = trackers[note.tracker].notes.filter(function (obj) {
            return obj.uuid !== result.args.uuid
          })

          spendNote(note)

          if (unshieldBgTaskInProgress) {
            unshieldBgTaskInProgress = false
          }
        } else {
          console.log('note not found')
        }
      }
    } else {
      console.log(error)
    }
  })

  logShieldedTransfer.watch(function (error, result) {
    var found = false
    var o = {}
    var haveChange = false

    if (! error) {
      // console.log(JSON.stringify(result))

      if (result.event == 'LogShieldedTransfer') {
        // check if transaction is encrypted to our wallet
        for (var y = 0; y < trackers.length; y++) {
          decryptBlob(y, result)
        }
        // console.log(JSON.stringify(stBuffer))

        for (var key in stBuffer) {
          if (stBuffer[key] !== null && typeof stBuffer[key] === 'object') {
            if (stBuffer[key].n1.uuid == result.args.uuid_1) { // && stBuffer[key].n2.uuid == result.args.uuid_2
              o = stBuffer[key]
              // console.log("o : " + JSON.stringify(o))

              if (! _.isEmpty(o.n2)) {
                haveChange = true
                o.n2.confirmed = true
                trackers[o.n2.tracker].notes[result.args.uuid_2] = o.n2
              }

              found = true
              delete stBuffer[key]
              saveFile(p + 'scache.json', JSON.stringify(stBuffer))
              break
            }
          }
        }

        if (found) {
          console.log(JSON.stringify(result))

          console.log('[*] Shielded transfer ' + result.args.uuid_1 + ' / ' + result.args.uuid_2 + ' added to z-contract.')
          console.log('******************************************************************************************************************************')

          // console.log("buf is : " + JSON.stringify(o));

          // Input note is spent.
          trackers[o.n.tracker].spent[result.args.uuid] = o.n
          trackers[o.n.tracker].notes = trackers[o.n.tracker].notes.filter(function (obj) {
            return obj.uuid !== o.n.uuid
          })

          var myTx = {}

          if (haveChange) {
            spendNoteWithChange(o)
            var value = o.n.value - o.n2.value
          } else {
            var value = o.n.value
            spendNote(o.n)
          }

          myTx = makeTx(result.transactionHash, 'outbound', value, o.n.tracker, o.to, 'S', web3.eth.getBlock(result.blockNumber).timestamp)
          tmpTxs.push(myTx)
          tmpTxs = _.uniqBy(tmpTxs, function (e) {
            return e.txId
          })
          saveFile(p + 'transactions.json', JSON.stringify(tmpTxs))

          if (shieldedSendBgTaskInProgress) {
            shieldedSendBgTaskInProgress = false
          }
        }
      }
    }
  })
}
