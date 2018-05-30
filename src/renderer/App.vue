<template>
  <div id="app">
    <div class="container">

      <div class="text-right">
        <img class="main-logo" src="~@/assets/images/logo.png">
      </div>

      <ul class="nav nav-tabs mb-4">
        <li class="nav-item"><a class="nav-link active" href="#">Overview</a></li>
        <li class="nav-item"><a class="nav-link" href="#">Send</a></li>
        <li class="nav-item"><a class="nav-link" href="#">Receive</a></li>
        <li class="nav-item"><a class="nav-link" href="#">Shield</a></li>
        <li class="nav-item"><a class="nav-link" href="#">Settings</a></li>
      </ul>

      <div class="tab-content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'glyff-wallet'
  }
</script>
