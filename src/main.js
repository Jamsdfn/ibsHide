import Vue from 'vue'
import App from './App.vue'
import { Button, Input, Dialog } from 'element-ui'

Vue.component(Button.name, Button)
Vue.component(Input.name, Input)
Vue.component(Dialog.name, Dialog)

// 根据当前网络确定后端接口，方便手机上测试
Vue.prototype.backEnd = 'https://192.168.1.11:3000'

new Vue({
  el: '#app',
  render: h => h(App)
})
