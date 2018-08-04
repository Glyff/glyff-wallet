<template>
  <div>
    <div class="row">
      <!-- Begin Logo Block -->
      <div id="logo-block">
        <img src="@/assets/images/glyff-logo.png" title="Glyff" />
      </div>
      <!-- End Logo Block -->
    </div>
    <div>
      <!-- Begin Profile Info Block -->
      <div class="form-group current-account-form">
        <label>Current account</label>
        <multiselect :options="accounts"
                     :value="currentAccount"
                     @input="changeAccount"
                     track-by="address"
                     :custom-label="({name, address}) => name || address"
                     :searchable="false"
                     :allow-empty="false"
                     :show-labels="false"
        ></multiselect>
      </div>
      <!-- End Profile Info Block -->
    </div>
    <div class="row" id="navigation-row">
      <!-- Begin Navigation Block -->
      <div id="navigation-block" class="container-fluid">
        <!-- Begin Navigation -->
        <ul id="navigation">
          <router-link tag="li" to="/"><a><img src="@/assets/images/overview-icon.png" title="Overview"> Overview</a></router-link>
          <router-link tag="li" to="/accounts"><a><img src="@/assets/images/settings-icon.png" title="Accounts"> Accounts</a></router-link>
          <router-link tag="li" to="/send"><a><img src="@/assets/images/send-icon.png" title="Send"> Send</a></router-link>
          <router-link tag="li" to="/receive"><a><img src="@/assets/images/receive-icon.png" title="Receive"> Receive</a></router-link>
          <router-link tag="li" to="/shield"><a><img src="@/assets/images/shield-icon.png" title="Shield"> Shield</a></router-link>
          <router-link tag="li" to="/settings"><a><img src="@/assets/images/settings-icon.png" title="Settings"> Settings</a></router-link>
        </ul>
        <!-- End Navigation -->
      </div>
      <!-- End Navigation Block -->
    </div>
    <p class="text-center mt-40">Last block: {{ lastBlock }}</p>
    <p class="text-center" v-if="syncingBlock">Syncing block: {{ syncingBlock }}</p>
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect/src/Multiselect.vue'
import { mapState, mapGetters, mapMutations } from 'vuex'

export default {
  components: {
    Multiselect,
  },

  computed: {
    ...mapState({
      accounts: s => s.accounts.accounts,
      lastBlock: s => s.accounts.lastBlock,
      syncingBlock: s => s.accounts.syncingBlock,
    }),

    ...mapGetters({
      currentAccount: 'accounts/currentAccount',
    })
  },

  methods: {
    ...mapMutations({
      changeAccount: 'accounts/CHANGE_ACCOUNT',
    }),
  },
}
</script>
