import Vue from 'vue'
import App from './App.vue'
import { Button, Input } from 'element-ui'

Vue.component(Button.name, Button)
Vue.component(Input.name, Input)

Vue.prototype.backEnd = 'http://127.0.0.1:3000'

new Vue({
  el: '#app',
  render: h => h(App)
})
