<script setup>
import Toast from 'primevue/toast';
import MainMenu from "@/components/MainMenu.vue";
import MatchCelebration from "@/components/modal/MatchCelebration.vue";
</script>

<template>
  <main>
    <MainMenu />
    <Toast />
    <MatchCelebration />

    <!-- context based views -->
    <router-view />
  </main>
</template>

<style scoped>
</style>
