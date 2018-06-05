// Copyright 2017 Zerocoin Electric Coin Company LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

ztracker = function () {}

ztracker.prototype.shield = function (ztoken, value, sel, tracker = null, cb) {
  var _t
  if (tracker !== null) {
    _t = tracker
  } else {
    _t = trackers[selectedTracker]
  }

  var rho = web3.zsl.getRandomness()
  var pk = _t.a_pk

  console.log('***************************************************************')
  console.log('[*] Generating proof for shielding - value : ' + value)

  var start = new Date()

  var result = web3.zsl.createShielding(rho, pk, value)
  var elapsed = new Date() - start

  console.log('[*] Generated in ' + elapsed / 1000 + ' secs')

  $('#ShieldElapsedTime').html(' Done in ' + (elapsed / 1000).toString() + ' seconds. Waiting for contract event ... ')

  showShieldProgressBar()
  shieldBgTaskInProgress = true

  var uuid = web3.toHex(web3.sha3(result.cm, {encoding: 'hex'}))
  var note = {}
  note.rho = rho
  note.value = value
  note.uuid = uuid
  note.ztoken = ztoken.address
  note.confirmed = false
  note.account = sel
  note.tracker = _t.id

  notesBuffer.push(note)
  saveFile(p + 'cache.json', JSON.stringify(notesBuffer))

  ztoken.shield(result.proof, result.send_nf, result.cm, value,

    {from: sel, gas: 200000},

    function (error, result) {
      if (! error) {
        $('#shieldBtn').prop('disabled', false)
        cb(note.uuid)
      } else {
        console.log(error)

        $('#shieldModalErrMsg').fadeIn('slow')
        $('#shieldModalErrMsg').html(error)
        $('#shieldModalErrMsg').fadeOut('slow')
        $('#shieldBtn').prop('disabled', false)
        cb(false)
      }
    })

  // return "Waiting for log event...";
}

ztracker.prototype.unshield = function (uuid, tracker = null, cb = null) {
  var t
  var account
  var found = false

  if (tracker !== null) {
    t = tracker
  } else {
    t = trackers[selectedTracker]
    account = accounts[selectedAcct].address
  }

  for (var i = 0; i < t.notes.length; i++) {
    if (t.notes[i].uuid == uuid) {
      note = t.notes[i]
      account = t.notes[uuid].account
      found = true
    }
  }

  if (found) {
    var note = t.notes[uuid]
    var a = note.ztoken
    var ztoken = tokenContract // ztoken_abi.at(a);

    // console.log(JSON.stringify(note));

    var cm = web3.zsl.getCommitment(note.rho, t.a_pk, note.value)
    var witnesses = ztoken.getWitness(cm)
    var treeIndex = parseInt(witnesses[0])
    var authPath = witnesses[1]

    console.log('***************************************************************')
    console.log('[*] Generating proof for unshielding')

    var start = new Date()

    unshieldBgTaskInProgress = true
    showUnShieldProgressBar()

    var result = web3.zsl.createUnshielding(note.rho, t.a_sk, note.value, treeIndex, authPath, function (error, result) {
      console.log(error + ' / ' + JSON.stringify(result))

      var elapsed = new Date() - start

      console.log('[*] Generated in ' + elapsed / 1000 + ' secs')

      $('#UnshieldElapsedTime').html(' Done in ' + (elapsed / 1000).toString() + ' seconds. Waiting for contract event ... ')

      var rt = ztoken.root()

      ztoken.unshield(result.proof,
        result.spend_nf,
        cm, rt,
        note.value,
        {from: accounts[selectedAcct].address, gas: unshieldGas},

        function (error, result) {
          if (! error) {
            note.confirmed = false
            cb(false, result)
          } else {
            unshieldBgTaskInProgress = false
            cb(error, null)
          }
        })
    })
  }
}

ztracker.prototype.list = function (ztoken, amount) {
  var result = []
  var name = ztoken.name()
  var addr = ztoken.address
  if (amount == undefined) {
    amount = 0
  }
  for (var uuid in notes) {
    var note = notes[uuid]
    if (addr == note.ztoken && (note.value >= amount)) {
      result.push(note)
    }
  }

  console.log('***************************************************************')
  console.log('Found ' + result.length + ' ' + name + ' notes >= ' + amount)
  console.log(JSON.stringify(result, null, 4))
  console.log('***************************************************************')
}

ztracker.prototype.balance = function (ztoken) {
  var result = 0
  var name = ztoken.name()
  var addr = ztoken.address
  for (var uuid in this.notes) {
    var note = this.notes[uuid]
    if (addr == note.ztoken) {
      result += note.value
    }
  }
  console.log('***************************************************************')
  console.log('Shielded balance of ' + name + ' = ' + result)
  console.log('***************************************************************')
}

ztracker.prototype.sendTx = function (ztoken, uuid, tIndex, amount, recipient_apk, cb) {
  var blob = null
  var empty_uncles = ['0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100', '0x8000000000000000000000000000000000000000000000000000000000000100']
  var note = trackers[tIndex].notes[uuid]

  if (note === undefined || note == null && typeof note !== 'object') {
    console.log(' fatal error with note, skipping.')
    return
  }

  if (note.value < amount) {
    console.log('Cannot transfer ' + amount + ' as note value of ' + note.value + ' is too small.')
    return
  }

  var change = note.value - amount
  var cm = web3.zsl.getCommitment(note.rho, trackers[tIndex].a_pk, note.value)
  var witnesses = ztoken.getWitness(cm)
  var treeIndex = parseInt(witnesses[0])
  var authPath = witnesses[1]

  var tmpKeypair = web3.zsl.GenerateZKeypair()
  var out_rho_1 = web3.zsl.getRandomness()
  var out_rho_2 = web3.zsl.getRandomness()

  console.log('***************************************************************')
  console.log('[*] Generating proof for shielded transfer')

  var start = new Date()

  showShieldedSendProgressBar()
  shieldedSendBgTaskInProgress = true

  /* console.log(         "Calling with parameters : "+ "\n"
                          + " note_rho : "            + note.rho + "\n"
                          + " tracker.keypair.a_sk :" + trackers[tIndex].a_sk + "\n"
                          + " note.value : "          + note.value + "\n"
                          + " treeIndex : "           + treeIndex + "\n"
                          + " authpath : "            + authPath + "\n"
                          + " randomness :"           + web3.zsl.getRandomness()  + "\n"
                          + " tmpKeypair.a_sk :"      + tmpKeypair.a_sk + "\n"
                          + " out_rho_1 : "           + out_rho_1 + "\n"
                          + " out_rho_2 : "           + out_rho_2 +"\n"
                          + " recipient_apk : "       + recipient_apk + "\n"
                          + " amount : "              + amount + "\n"
                          + " tracker.keypair.a_pk: " + trackers[tIndex].a_pk + "\n"
                          + " change : "              + change ) */

  web3.zsl.createShieldedTransfer(
    note.rho,
    trackers[tIndex].a_sk,
    note.value,
    treeIndex,
    authPath,
    web3.zsl.getRandomness(),
    tmpKeypair.a_sk,
    0,
    0,
    empty_uncles,
    out_rho_1,
    recipient_apk,
    amount,
    out_rho_2,
    trackers[tIndex].a_pk,
    change,
    function (err, result) {
      if (! err) {
        var elapsed = new Date() - start
        console.log('[*] Generated in ' + elapsed / 1000 + ' secs')

        $('#shieldedSendElapsedTime').html(' Done in ' + (elapsed / 1000).toString() + ' seconds. Waiting for contract event ... ')

        console.log('Ciphertext: ' + result.ciphertext + ' epk: ' + result.epk + ' message: ' + result.message + ' out_pk_1: ' + result.out_pk_1 + ' out_pkenc__1: ' + result.out_pkenc_1 + ' blob : ' + result.blob)
        blob = result.blob

        var n1 = {}
        n1.value = amount
        n1.rho = out_rho_1
        n1.uuid = web3.toHex(web3.sha3(result.out_cm_1, {
          encoding: 'hex'
        }))
        n1.ztoken = ztoken.address
        n1.confirmed = false
        n1.account = null
        n1.tracker = null

        console.log('[*] Recipient receives note of ' + amount + ' ' + ztoken.name())

        var n2 = {}

        if (change > 0) {
          n2.value = change
          n2.rho = out_rho_2
          n2.uuid = web3.toHex(web3.sha3(result.out_cm_2, {
            encoding: 'hex'
          }))
          n2.ztoken = ztoken.address
          n2.confirmed = false
          n2.account = accounts[selectedAcct].address
          n2.tracker = tIndex
        }

        console.log('[*] Sender receives change of ' + change + ' ' + ztoken.name())

        console.log('[*] Submit shielded transfer to z-contract...')
        var anchor = ztoken.root()

        var o = {
          n: note,
          n1: n1,
          n2: n2,
          to: recipient_apk
        }

        stBuffer.push(o)
        saveFile(p + 'scache.json', JSON.stringify(stBuffer))

        ztoken.shieldedTransfer(
          result.proof, anchor,
          result.in_spend_nf_1,
          result.in_spend_nf_2,
          result.out_send_nf_1,
          result.out_send_nf_2,
          result.out_cm_1,
          result.out_cm_2,
          blob, {
            from: accounts[selectedAcct].address,
            gas: 5470000

          },
          function (err, result) {
            if (! err) {
              cb(false, result)
            } else {
              cb(err, null)
            }
          })
      } else {
        console.log(err)
        cb(err, null)
      }
    })
}
