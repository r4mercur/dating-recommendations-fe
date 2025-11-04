import { createRouter, createWebHistory } from "vue-router";

import HomeView from "@/pages/HomeView.vue";
import AboutView from "@/pages/AboutView.vue";
import LoginForm from "@/components/LoginForm.vue";
import MatchesView from "@/pages/MatchesView.vue";
import RegistrationForm from "@/components/RegistrationForm.vue";
import {useUserStore} from "@/stores/user.js";
import ChatView from "@/pages/ChatView.vue";

const routes = [
    { path: "/", component: HomeView },
    { path: "/about", component: AboutView },
    { path: "/login", component: LoginForm },
    { path: "/registration", component: RegistrationForm },
    { path: '/matches', component: MatchesView, meta: { requiresAuth: true} },
    { path: '/messages', component: ChatView, meta: { requiresAuth: true} },
];

export const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const userStore = useUserStore();

    if (to.meta.requiresAuth && !userStore.user) {
        next('/login');
    } else {
        next();
    }
})