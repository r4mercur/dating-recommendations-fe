import './assets/main.css'

import {createApp} from 'vue'
import {createPinia} from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import {router} from './router';


const application = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)

application.use(pinia);
application.use(router);

application.mount("#app");
