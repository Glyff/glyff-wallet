<template>
  <div class="container-fluid">
    <div class="loading-overlay" v-if="globalLoading">Loading...</div>
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
  </div>
</template>

<script>
import {mapState} from 'vuex'
import Sidebar from './Sidebar'

export default {
  components: {
    Sidebar,
  },

  computed: {
    ...mapState({
      globalLoading: s => s.general.globalLoading,
    })
  },
}
</script>
