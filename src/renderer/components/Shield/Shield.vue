<template>
  <div id="shield-block">
    <div class="row">
      <div class="col-md-12">
        <h2 class="right-side-title">Shield<br />
          <span class="right-side-sub-title">Shield Sub Title</span>
        </h2>
      </div>
    </div>
    <balances></balances>
    <div class="row table-content-top-navigation">
      <div class="col-md-12 table-content-top-btn-block">
        <a href="#" @click.prevent="newAddress()"><img src="@/assets/images/plus-icon.png">New Z-Address</a>
        <a href="#" @click.prevent="showShield = true"><img src="@/assets/images/chart-icon.png">Shield</a>
        <a href="#" @click.prevent="showUnshield = true"><img src="@/assets/images/chart-icon.png">Unshield</a>
        <a href="#" @click.prevent="showSend = true"><img src="@/assets/images/send-small-icon.png">Send</a>
        <a href="#"><img src="@/assets/images/reset-icon.png">Reset</a>
      </div>
    </div>
    <div class="simple-panel">
      <table class="table table-hover">
        <thead>
        <tr>
          <th>Address</th>
          <th>Balance</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="tracker in trackers" @click="showInfo(tracker)" class="clickable">
          <td>{{ tracker.zaddr | truncate(80) }}</td>
          <td>{{ tracker.balance | ether('GLX', 'GLX') }}</td>
          <td class="text-right">
            <a href="#" class="btn btn-info btn-xs"><i class="fa fa-pencil"></i></a>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <address-info-modal v-model="showAddressInfo" :tracker="selectedTracker"></address-info-modal>
    <shield-modal v-model="showShield"></shield-modal>
    <unshield-modal v-model="showUnshield"></unshield-modal>
    <send-modal v-model="showSend"></send-modal>
  </div>
</template>

<script>
import {mapState, mapGetters, mapActions} from 'vuex'
import Balances from '../Layout/Balances'
import AddressInfoModal from './AddressInfoModal'
import ShieldModal from './ShieldModal'
import UnshieldModal from './UnshieldModal'
import SendModal from './SendModal'

export default {
  components: {
    Balances,
    AddressInfoModal,
    ShieldModal,
    UnshieldModal,
    SendModal,
  },

  data () {
    return {
      selectedTracker: {},
      showAddressInfo: false,
      showShield: false,
      showUnshield: false,
      showSend: false,
    }
  },

  computed: {
    ...mapState({
      stateTrackers: s => s.trackers.trackers,
    }),

    ...mapGetters({
      trackers: 'currentTrackers',
      account: 'currentAccount',
    }),
  },

  methods: {
    ...mapActions({
      createTracker: 'createTracker',
    }),

    showInfo (tracker) {
      this.selectedTracker = tracker
      this.showAddressInfo = true
    },

    newAddress () {
      this.createTracker(this.account)
    },
  },
}
</script>
