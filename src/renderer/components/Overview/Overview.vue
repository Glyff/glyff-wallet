<template>
  <div>
    <div class="left-side">
      <span class="title">
        Welcome to your new project!
      </span>
      <system-information></system-information>
    </div>

    <div class="right-side">
      <div class="doc">
        <div class="title">Getting Started</div>
        <p>
          electron-vue comes packed with detailed documentation that covers everything from
          internal configurations, using the project structure, building your application,
          and so much more.
        </p>
        <button @click="open('https://simulatedgreg.gitbooks.io/electron-vue/content/')">Read the Docs</button>
        <br><br>
      </div>
      <div class="doc">
        <div class="title alt">Other Documentation</div>
        <button class="alt" @click="open('https://electron.atom.io/docs/')">Electron</button>
        <button class="alt" @click="open('https://vuejs.org/v2/guide/')">Vue.js</button>
      </div>
    </div>
  </div>
</template>

<script>
import SystemInformation from '../LandingPage/SystemInformation'

export default {
  name: 'overview',
  components: {
    SystemInformation,
  },
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link)
    }
  }
}
</script>
