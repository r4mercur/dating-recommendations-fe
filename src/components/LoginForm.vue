<script setup>
import {ref} from 'vue'
import {useToast} from '@/composables/useToast.js'
import {useForm} from '@/composables/useForm.js'
import {useUserStore} from '@/stores/user.js'
import {router} from '@/router.js'

const userStore = useUserStore()
const toast = useToast()

const submitting = ref(false)

const resolver = (values) => {
  const errors = {}
  if (!values.email) errors.email = 'Email is required.'
  if (!values.password) errors.password = 'Password is required.'
  return errors
}

const {values, errors, blur, input, handleSubmit} = useForm({
  initialValues: {email: '', password: ''},
  resolver
})

const onFormSubmit = handleSubmit(async ({email, password}) => {
  if (submitting.value) return
  submitting.value = true
  try {
    const user = await userStore.login(email, password);
    toast.add({severity: 'success', summary: 'Logged in', detail: `Welcome ${user.name || user.email}!`, life: 3000})
  } catch (error) {
    toast.add({severity: 'error', summary: "Couldn't sign you in", detail: error.message, life: 5000})
  } finally {
    submitting.value = false
  }
})

const toRegistration = () => router.push('/registration');
</script>

<template>
  <div class="auth-page">
    <div class="auth-inner">
      <h2 class="auth-title">Sign in to your account</h2>

      <div class="form-container">
        <form novalidate @submit="onFormSubmit">
          <div class="field">
            <input v-model="values.email" name="email" type="email" class="input" placeholder="Email"
                   aria-label="Email" autocomplete="email" :aria-invalid="!!errors.email"
                   @blur="blur('email')" @input="input('email')"/>
            <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
          </div>

          <div class="field">
            <input v-model="values.password" name="password" type="password" class="input" placeholder="Password"
                   aria-label="Password" autocomplete="current-password" :aria-invalid="!!errors.password"
                   @blur="blur('password')" @input="input('password')"/>
            <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
          </div>

          <button type="submit" class="btn btn-block" :disabled="submitting">
            <i v-if="submitting" class="icon icon-spin icon-spinner" aria-hidden="true"></i>
            Sign in
          </button>
        </form>

        <div class="switch">
          <span>Don't have an account? </span>
          <button type="button" class="btn btn-link" @click="toRegistration">Register here</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  padding: 0 1.5rem;
}

.auth-inner {
  width: 100%;
}

.auth-title {
  margin-top: 3rem;
  font-size: 1.75rem;
  font-weight: 800;
  text-align: center;
}

.form-container {
  max-width: 1000px;
  margin: 0.5rem auto 0;
  padding: 1.5rem 3rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
}

form > * + * {
  margin-top: 1.5rem;
}

.switch {
  margin-top: 3rem;
  font-size: 0.875rem;
  text-align: center;
}

.switch .btn-link {
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
