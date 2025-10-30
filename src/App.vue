<script setup>
import Toast from 'primevue/toast';
import MainMenu from "@/components/MainMenu.vue";


</script>

<template>
  <main>
    <MainMenu />
    <Toast />

    <!-- context based views -->
    <router-view />
  </main>
</template>

<style scoped>
</style>
