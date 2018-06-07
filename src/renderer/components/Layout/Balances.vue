<template>
  <div class="clearfix balance-and-export-data-block">
    <div class="balance green-balance">
      <img src="@/assets/images/white-target-icon.png" />
      <a href="#" class="anchor green-anchor">{{ tBalance | ether('GLY') }}</a>
      <small>T-balance</small>
    </div>
    <div class="balance white-balance">
      <img src="@/assets/images/green-target-icon.png" />
      <a href="#" class="anchor white-anchor">{{ sBalance | ether('GLX') }}</a>
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
      sBalance: s => s.general.sBalance,
      accounts: s => s.general.accounts,
    }),

    ...mapGetters({
      balanceForAddress: 'general/balanceForAddress',
    }),

    tBalance () {
      if (this.accounts.length) return this.balanceForAddress(this.accounts[0].address)
      return 0
    },
  }
}
</script>
