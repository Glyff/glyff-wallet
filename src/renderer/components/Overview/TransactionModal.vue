<template>
  <modal :value="value" @input="$emit('input', $event)" title="Transaction details" size="lg">
    <table class="table table-hover">
      <tbody>
      <tr>
        <td>Transaction hash:</td>
        <td>{{ tx.hash }}</td>
      </tr>
      <tr>
        <td>Block number:</td>
        <td>{{ tx.blockNumber }}</td>
      </tr>
      <tr>
        <td>From:</td>
        <td>{{ tx.from }}</td>
      </tr>
      <tr>
        <td>To:</td>
        <td>{{ tx.to }}</td>
      </tr>
      <tr>
        <td>Type:</td>
        <td>{{ tx.type }}</td>
      </tr>
      <tr>
        <td>Direction:</td>
        <td>{{ tx.direction }}</td>
      </tr>
      <tr>
        <td>Value:</td>
        <td>{{ tx.amount | ether(tx.type && tx.type.toLowerCase(), tx.type) }}</td>
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

  props: ['value', 'tx'],
}
</script>
