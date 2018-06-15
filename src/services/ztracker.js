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

export const list = (ztoken, amount) => {
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

export const balance = (ztoken) => {
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

export const sendTx = (ztoken, uuid, tIndex, amount, recipient_apk, cb) => {
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
