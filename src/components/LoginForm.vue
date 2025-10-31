<script setup>
import {useToast} from 'primevue/usetoast'
import {Form} from '@primevue/forms'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Toast from 'primevue/toast'
import {useUserStore} from '@/stores/user.js'
import {router} from '@/router.js'
import {useForm} from "@primevue/forms/useform";

const userStore = useUserStore()
const toast = useToast()

const initValues = { email: '', password: '' }

const resolver = ({ values }) => {
  const errors = {}
  if (!values.email) errors.email = [{ message: 'Email is required.' }]
  if (!values.password) errors.password = [{ message: 'Password is required.' }]
  return { errors }
}

const { values, meta, errors, handleSubmit } = useForm({ initialValues: initValues, resolver })

const onFormSubmit = handleSubmit(async (values) => {
  let email = values.originalEvent.states.email.value;
  let password = values.originalEvent.states.password.value;

  const user = await userStore.login(email, password);
  toast.add({ severity: 'success', summary: 'Logged in', detail: `Welcome ${user.name || user.email}!`, life: 3000 })
})

const toRegistration = () => router.push('/registration');
</script>

<template>
  <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold">Sign in to your account</h2>
      </div>

      <div class="mt-2 py-4 px-6 shadow-lg rounded-lg form-container">
        <Toast />

        <Form :resolver="resolver" @submit="onFormSubmit" class="space-y-6">
          <div>
            <InputText name="email" type="email" placeholder="Email" fluid class="w-full" />
            <Message v-if="meta?.email?.invalid" severity="error" size="small" variant="simple">
              {{ errors?.email?.[0]?.message }}
            </Message>
          </div>

          <div>
            <InputText name="password" type="password" placeholder="Password" fluid class="w-full" />
            <Message v-if="meta?.password?.invalid" severity="error" size="small" variant="simple">
              {{ errors?.password?.[0]?.message }}
            </Message>
          </div>

          <Button type="submit" label="Sign in" class="w-full" />
        </Form>

        <div class="mt-6 text-center">
          <span class="text-sm">Don't have an account? </span>
          <Button label="Register here" link @click="toRegistration" class="text-sm font-medium text-indigo-600 hover:text-indigo-500" />
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
.form-container {
  max-width: 1000px;
  margin: 0 auto;
}
</style>