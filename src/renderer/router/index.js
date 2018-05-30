import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'overview',
      component: require('@/components/Overview/Overview').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
