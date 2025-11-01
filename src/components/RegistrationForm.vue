<script setup>

import Message from "primevue/message";
import Button from "primevue/button";
import {Select} from "primevue";
import Toast from "primevue/toast";
import {Form} from "@primevue/forms";
import InputText from "primevue/inputtext";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import {router} from "@/router.js";
import {useForm} from "@primevue/forms/useform";
import {useUserStore} from "@/stores/user.js";
import {useToast} from "primevue/usetoast";

const userStore = useUserStore();
const toast = useToast();

const genders = [
    {
      'name': 'Male',
      'value': 'MALE'
    },
    {
      'name': 'Female',
      'value': 'FEMALE'
    },
    {
      'name': 'Divers',
      'value': 'DIVERS'
    }
];

const initValues ={
    username: '',
    email: '',
    password: '',
    age: 18,
    gender: '',
    street: '',
    city: '',
    zipCode: '',
    country: ''
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

  if (!values.age) {
    errors.age = [{ message: 'Age is required.' }];
  }

  if (!values.gender) {
    errors.gender = [{ message: 'Gender is required.' }];
  }
  if (!values.street) {
    errors.street = [{ message: 'Street is required.' }];
  }
  if (!values.city) {
    errors.city = [{ message: 'City is required.' }];
  }
  if (!values.zipCode) {
    errors.zipCode = [{ message: 'Zip code is required.' }];
  }
  if (!values.country) {
    errors.country = [{ message: 'Country is required.' }];
  }

  return {
    errors
  };
};

const { values, meta, errors, handleSubmit } = useForm({ initialValues: initValues, resolver });

const onFormSubmit = handleSubmit(async (values) => {
  let email = values.originalEvent.states.email.value;
  let username = values.originalEvent.states.username.value;
  let password = values.originalEvent.states.password.value;
  let age = values.originalEvent.states.age.value;
  let address = {
        street: values.originalEvent.states.street.value,
        city: values.originalEvent.states.city.value,
        zipCode: values.originalEvent.states.zipCode.value,
        country: values.originalEvent.states.country.value
  };
  let gender = values.originalEvent.states.gender.value.value;

  const user = await userStore.register(username, email, password, age, address, gender);
  toast.add({ severity: 'success', summary: 'Registered', detail: `Welcome ${user.name || user.email}!`, life: 3000 });
});


const toLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold">
          Create your account
        </h2>
      </div>
      <div class="mt-2 py-4 px-6 shadow-lg rounded-lg form-container">
        <Toast />
        <Form v-slot="$form" :initialValues="initValues" :resolver :validateOnValueUpdate="false" :validateOnBlur="true" @submit="onFormSubmit" class="space-y-6">
          <div class="space-y-2">
            <label for="username" class="block text-sm font-medium ">
              Username
            </label>
            <div class="mt-1">
              <InputText
                  id="username"
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
            <label for="password" class="block text-sm font-medium ">
              Password
            </label>
            <div class="mt-1">
              <InputText
                  id="password"
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

          <div class="space-y-2">
            <label for="age" class="block text-sm font-medium ">
              Age
            </label>
            <div class="mt-1">
              <InputText
                  id="age"
                  name="age"
                  type="number"
                  placeholder="Enter your age"
                  fluid
                  class="w-full"
              />
            </div>
            <Message v-if="$form.age?.invalid" severity="error" size="small" variant="simple" class="mt-1">
              {{ $form.age?.error?.message }}
            </Message>
          </div>

          <div class="space-y-2">
            <label for="gender" class="block text-sm font-medium">
              Gender
            </label>
            <Select
                id="gender"
                name="gender"
                :options="genders"
                optionLabel="name"
                placeholder="Select a gender"
                class="w-full"
            />
            <Message
                v-if="$form.gender?.invalid"
                severity="error"
                size="small"
                variant="simple"
                class="mt-1"
            >
              {{ $form.gender?.error?.message }}
            </Message>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium">Address</label>
            <div class="address-container space-y-4">
              <!-- Street Address -->
              <div class="space-y-2">
                <label for="street" class="block text-sm font-medium">
                  Street & Number
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-home"></i>
                  </InputGroupAddon>
                  <InputText
                      id="street"
                      name="street"
                      type="text"
                      placeholder="Enter street and number"
                      fluid
                  />
                </InputGroup>
                <Message v-if="$form.street?.invalid" severity="error" size="small" variant="simple" class="mt-1">
                  {{ $form.street?.error?.message }}
                </Message>
              </div>

              <!-- Zip Code and City -->
              <div class="grid grid-cols-2 gap-4 zip-city">
                <div class="space-y-2">
                  <label for="zipCode" class="block text-sm font-medium">
                    Zip Code
                  </label>
                  <InputGroup>
                    <InputGroupAddon>
                      <i class="pi pi-hashtag"></i>
                    </InputGroupAddon>
                    <InputText
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        placeholder="12345"
                        fluid
                    />
                  </InputGroup>
                  <Message v-if="$form.zipCode?.invalid" severity="error" size="small" variant="simple" class="mt-1">
                    {{ $form.zipCode?.error?.message }}
                  </Message>
                </div>

                <div class="space-y-2">
                  <label for="city" class="block text-sm font-medium">
                    City
                  </label>
                  <InputGroup>
                    <InputGroupAddon>
                      <i class="pi pi-building"></i>
                    </InputGroupAddon>
                    <InputText
                        id="city"
                        name="city"
                        type="text"
                        placeholder="Your city"
                        fluid
                    />
                  </InputGroup>
                  <Message v-if="$form.city?.invalid" severity="error" size="small" variant="simple" class="mt-1">
                    {{ $form.city?.error?.message }}
                  </Message>
                </div>
              </div>

              <!-- Country -->
              <div class="space-y-2">
                <label for="country" class="block text-sm font-medium pt-2">
                  Country
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-globe"></i>
                  </InputGroupAddon>
                  <InputText
                      id="country"
                      name="country"
                      type="text"
                      placeholder="Enter your country"
                      fluid
                  />
                </InputGroup>
                <Message v-if="$form.country?.invalid" severity="error" size="small" variant="simple" class="mt-1">
                  {{ $form.country?.error?.message }}
                </Message>
              </div>
            </div>
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

:deep(.p-inputgroupaddon) {
  border: 1px solid #d1d5db;
  border-right: none!important;
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

.address-container {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--p-primary-color);
}


:deep(.p-inputgroup .p-inputtext) {
  border-left: none;
}

.zip-city {
  padding-left: 10px;
  padding-top: 15px;
}
</style>