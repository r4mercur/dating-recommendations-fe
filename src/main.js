import './assets/main.css'
import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import { router } from './router';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice';


const application = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)

application.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
application.use(ToastService);
application.use(pinia);
application.use(router);

application.mount("#app");