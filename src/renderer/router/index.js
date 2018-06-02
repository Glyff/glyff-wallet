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
      path: '/send',
      name: 'send',
      component: require('@/components/Send/Send').default
    },
    {
      path: '/receive',
      name: 'receive',
      component: require('@/components/Receive/Receive').default
    },
    {
      path: '/shield',
      name: 'shield',
      component: require('@/components/Shield/Shield').default
    },
    {
      path: '/settings',
      name: 'settings',
      component: require('@/components/Settings/Settings').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
