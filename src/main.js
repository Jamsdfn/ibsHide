import Vue from 'vue'
import App from './App.vue'
import { Button, Input, Dialog } from 'element-ui'

Vue.component(Button.name, Button)
Vue.component(Input.name, Input)
Vue.component(Dialog.name, Dialog)

Vue.prototype.backEnd = 'http://127.0.0.1:3000'

new Vue({
  el: '#app',
  render: h => h(App)
})
