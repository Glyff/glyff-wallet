<template>
  <div class="clearfix balance-and-export-data-block">
    <div class="balance green-balance">
      <img src="@/assets/images/white-target-icon.png" />
      <a href="#" class="anchor green-anchor">{{ tBalance.toFixed(4) }} GLY</a>
      <small>T-balance</small>
    </div>
    <div class="balance white-balance">
      <img src="@/assets/images/green-target-icon.png" />
      <a href="#" class="anchor white-anchor">{{ sBalance.toFixed(4) }} GLX</a>
      <small>S-balance</small>
    </div>
    <div class="balance white-balance export">
      <img src="@/assets/images/export-icon.png" />
      <a href="#" class="anchor white-anchor">Export Data</a>
      <small>Save your data</small>
    </div>
  </div>
</template>

<script>
import {mapState} from 'vuex'

export default {
  computed: {
    ...mapState({
      tBalance: s => s.general.tBalance,
      sBalance: s => s.general.sBalance,
    }),
  }
}
</script>
