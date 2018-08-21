<template>
  <modal :value="value" @input="$emit('input', $event)" title="Z-Address details" size="lg">
    <table class="table table-hover table-fixed">
      <tbody>
      <tr>
        <td style="width: 20%;">Z-Address:</td>
        <td class="break-word">{{ tracker.zaddr }}</td>
      </tr>
      <tr>
        <td style="width: 20%;">Balance:</td>
        <td class="break-word">{{ tracker.balance | ether('GLX', 'GLX') }}</td>
      </tr>
      </tbody>
    </table>

    <h4>Notes list:</h4>

    <table class="table table-hover table-fixed">
      <tbody>
      <tr>
        <th style="width: 50%">Transaction Hash</th>
        <th style="width: 40%">Contract Address</th>
        <th style="width: 10%">Value</th>
      </tr>
      <tr v-for="note in confirmedNotes">
        <td class="break-word">{{ note.txHash }}</td>
        <td>{{ note.contract }}</td>
        <td>{{ note.value | ether('GLX', 'GLX') }}</td>
      </tr>
      </tbody>
    </table>

    <div slot="footer" class="text-right">
      <button class="btn btn-default" @click="$emit('input', false)">Close</button>
    </div>
  </modal>
</template>

<script>
import {Modal} from 'uiv'

export default {
  components: {
    Modal,
  },

  props: ['value', 'tracker'],

  computed: {
    confirmedNotes () {
      return this.tracker.notes.filter(note => note.confirmed)
    }
  }
}
</script>
