<script setup>
import {useUserStore} from "@/stores/user.js";
import LoginForm from "@/components/LoginForm.vue";
import {computed} from "vue";
import {storeToRefs} from "pinia";
import Profile from "@/components/Profile.vue";

const userStore = useUserStore();
const {user} = storeToRefs(userStore);

const isLoggedIn = computed(() => user.value !== null);
</script>

<template>
  <div>
    <template v-if="isLoggedIn">
      <Profile />
    </template>
    <template v-else>
      <LoginForm />
    </template>
  </div>
</template>

<style scoped>

</style>