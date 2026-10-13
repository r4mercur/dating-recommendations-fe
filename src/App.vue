<script setup>
import {watch} from 'vue';
import MainMenu from "@/components/MainMenu.vue";
import ToastHost from "@/components/ToastHost.vue";
import MatchCelebration from "@/components/modal/MatchCelebration.vue";
import {useUserStore} from "@/stores/user.js";
import {useChatStore} from "@/stores/chat.js";

const userStore = useUserStore();
const chatStore = useChatStore();

// one real-time connection while logged in; a new token (login) reconnects, logout closes it
// (login sets the token before the user is loaded, so both are watched)
watch(() => [userStore.token, userStore.user?.referenceId], ([token, referenceId]) => {
  if (token && referenceId) {
    chatStore.connect(token, referenceId);
  } else {
    chatStore.disconnect();
  }
}, {immediate: true});
</script>

<template>
  <main>
    <MainMenu />
    <ToastHost />
    <MatchCelebration />

    <!-- context based views -->
    <router-view />
  </main>
</template>

<style scoped>
</style>
