<template>
  <div class="clearfix balance-and-export-data-block">
    <div class="balance green-balance">
      <img src="@/assets/images/white-target-icon.png" />
      <a href="#" class="anchor green-anchor">{{ glyBalance | ether('GLY', 'GLY') }}</a>
      <small>T-balance</small>
    </div>
    <div class="balance white-balance">
      <img src="@/assets/images/green-target-icon.png" />
      <a href="#" class="anchor white-anchor">{{ glxBalance | ether('GLX', 'GLX') }}</a>
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
import {mapState, mapGetters} from 'vuex'

export default {
  computed: {
    ...mapState({
      // tBalance: s => s.general.tBalance,
      // glyBalance: s => s.sBalance,
      accounts: s => s.accounts.accounts,
    }),

    ...mapGetters({
      glyBalance: 'glyBalance',
      glxBalance: 'glxBalance',
    }),
  }
}
</script>
