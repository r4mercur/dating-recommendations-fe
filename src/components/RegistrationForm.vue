<script setup>

import Message from "primevue/message";
import Button from "primevue/button";
import Toast from "primevue/toast";
import {Form} from "@primevue/forms";
import InputText from "primevue/inputtext";
import {router} from "@/router.js";


const initValues = {
  username: '',
  email: '',
  password: ''
};

const resolver = ({ values }) => {
  const errors = {};

  if (!values.username) {
    errors.username = [{ message: 'Username is required.' }];
  }

  if (!values.email) {
    errors.email = [{ message: 'Email is required.' }];
  }

  if (!values.password) {
    errors.password = [{ message: 'Password is required.' }];
  }

  return {
    errors
  };
};

const onFormSubmit = async ({ valid, values }) => {}

const toLogin = () => {
  router.push('/login');
};

</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold">
          Create your account
        </h2>
      </div>
      <div class="mt-2 py-4 px-6 shadow-lg rounded-lg">
        <Toast />
        <Form v-slot="$form" :initialValues="initValues" :resolver :validateOnValueUpdate="false" :validateOnBlur="true" @submit="onFormSubmit" class="space-y-6">
          <div class="space-y-2">
            <label for="reg-username" class="block text-sm font-medium ">
              Username
            </label>
            <div class="mt-1">
              <InputText
                  id="reg-username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  fluid
                  class="w-full"
              />
            </div>
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple" class="mt-1">
              {{ $form.username?.error?.message }}
            </Message>
          </div>

          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium ">
              Email
            </label>
            <div class="mt-1">
              <InputText
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  fluid
                  class="w-full"
              />
            </div>
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple" class="mt-1">
              {{ $form.email?.error?.message }}
            </Message>
          </div>

          <div class="space-y-2">
            <label for="reg-password" class="block text-sm font-medium ">
              Password
            </label>
            <div class="mt-1">
              <InputText
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  fluid
                  class="w-full"
              />
            </div>
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple" class="mt-1">
              {{ $form.password?.error?.message }}
            </Message>
          </div>

          <div class="pt-4">
            <Button
                type="submit"
                severity="primary"
                label="Register"
                class="w-full py-3 text-base font-medium"
            />
          </div>
        </Form>

        <div class="mt-6 text-center">
          <span class="text-sm ">Already have an account? </span>
          <Button
              label="Sign in here"
              link
              @click="toLogin"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

:deep(.p-inputtext) {
  width: 100% !important;
  display: block;
  margin-bottom: 0.5rem;
}

:deep(.p-button) {
  width: 100%;
  justify-content: center;
}

label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

:deep(.p-inputtext) {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

:deep(.p-inputtext:focus) {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

:deep(.p-message) {
  margin-top: 0.25rem;
}
</style>