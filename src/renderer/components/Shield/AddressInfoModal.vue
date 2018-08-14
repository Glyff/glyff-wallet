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
}
</script>
