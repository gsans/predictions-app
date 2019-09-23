import Vue from 'vue'
import Router from 'vue-router'
import Text from './views/Text.vue'
import Images from './views/Images.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/', 
      redirect: '/text' 
    },
    {
      path: '/text',
      name: 'text',
      component: Text
    },
    {
      path: '/images',
      name: 'images',
      component: Images
    }
  ]
})
