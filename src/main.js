import Vue from 'vue'
import App from './App.vue'
import router from './router'
import Amplify, * as AmplifyModules from 'aws-amplify'
import { AmplifyPlugin } from 'aws-amplify-vue'
import awsconfig from './aws-exports'
import Predictions, { AmazonAIPredictionsProvider } from '@aws-amplify/predictions';
Amplify.configure(awsconfig)
Predictions.addPluggable(new AmazonAIPredictionsProvider());
Vue.use(AmplifyPlugin, AmplifyModules)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
