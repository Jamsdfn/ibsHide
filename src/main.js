import Vue from 'vue'
import App from './App.vue'

Vue.prototype.backEnd = 'http://127.0.0.1:3000'

new Vue({
  el: '#app',
  render: h => h(App)
})
