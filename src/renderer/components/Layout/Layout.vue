<template>
  <div class="container-fluid">
    <toast position="nw"></toast>
    <div class="loading-overlay" v-if="globalLoading">
      <grid-loader></grid-loader>
    </div>
    <div class="row">
      <div id="left-side" class="col-md-3">
        <sidebar></sidebar>
      </div>
      <div id="right-side" class="col-md-9">
        <transition name="fade">
          <router-view></router-view>
        </transition>
      </div>
    </div>
    <modal v-model="showError" :backdrop="false" :footer="false" :header="false">
      <span slot="title">Error</span>
      <div class="alert alert-danger mb-0">{{ galobalError }}</div>
    </modal>
  </div>
</template>

<script>
import {Modal} from 'uiv'
import {mapState} from 'vuex'
import Toast from './Toast'
import Sidebar from './Sidebar'
import GridLoader from 'vue-spinner/src/GridLoader.vue'

export default {
  components: {
    Toast,
    Sidebar,
    Modal,
    GridLoader,
  },

  data () {
    return {
      showError: false,
      galobalError: null,
    }
  },

  computed: {
    ...mapState({
      globalLoading: s => s.general.globalLoading,
      connectionError: s => s.general.connectionError,
    })
  },

  watch: {
    connectionError (err) {
      if (err) {
        this.showError = true
        this.galobalError = err
      } else {
        this.showError = false
        this.galobalError = null
      }
    }
  },
}
</script>
