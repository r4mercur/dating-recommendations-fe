<script setup>
import {onMounted, ref} from "vue";
import {Form} from "@primevue/forms";
import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import MultiSelect from "primevue/multiselect";
import Password from "primevue/password";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import {useToast} from "primevue/usetoast";
import {router} from "@/router.js";
import {useUserStore} from "@/stores/user.js";
import {TagCategory, useTagsStore} from "@/stores/tags.js";
import {
  BIO_MAX_LENGTH,
  GENDERS,
  latestBirthDate,
  MAX_TAGS_PER_CATEGORY,
  PASSWORD_MIN_LENGTH,
  toIsoDate
} from "@/constants/profile.js";

const userStore = useUserStore();
const tagsStore = useTagsStore();
const toast = useToast();

const submitting = ref(false);
const maxBirthDate = latestBirthDate();

const initialValues = {
  name: '',
  email: '',
  password: '',
  birthDate: null,
  gender: null,
  bio: '',
  interests: [],
  hobbies: [],
  street: '',
  zipCode: '',
  city: '',
  country: 'DE',
};

const resolver = ({values}) => {
  const errors = {};
  const required = (field, message) => {
    if (!values[field] || (typeof values[field] === 'string' && !values[field].trim())) {
      errors[field] = [{message}];
    }
  };

  required('name', 'Name is required.');
  required('email', 'Email is required.');
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = [{message: 'Enter a valid email address.'}];
  }
  if (!values.password || values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = [{message: `Use at least ${PASSWORD_MIN_LENGTH} characters.`}];
  }
  required('birthDate', 'Birth date is required.');
  if (values.birthDate && values.birthDate > maxBirthDate) {
    errors.birthDate = [{message: 'You need to be at least 18.'}];
  }
  required('gender', 'Gender is required.');
  if ((values.bio || '').length > BIO_MAX_LENGTH) {
    errors.bio = [{message: `At most ${BIO_MAX_LENGTH} characters.`}];
  }
  required('zipCode', 'Zip code is required.');
  required('city', 'City is required.');
  required('country', 'Country is required.');

  return {errors};
};

async function onFormSubmit({valid, values}) {
  if (!valid || submitting.value) return;
  submitting.value = true;
  try {
    await userStore.register({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      birthDate: toIsoDate(values.birthDate),
      gender: values.gender,
      bio: values.bio?.trim() || null,
      interests: values.interests,
      hobbies: values.hobbies,
      address: {
        street: values.street?.trim() || null,
        zipCode: values.zipCode.trim(),
        city: values.city.trim(),
        country: values.country.trim(),
      },
    });
    toast.add({severity: 'success', summary: 'Welcome', detail: 'Your account is ready.', life: 3000});
    await userStore.login(values.email.trim(), values.password);
  } catch (error) {
    // e.g. email taken (409) or an address that can't be located (400)
    toast.add({severity: 'error', summary: "Couldn't create your account", detail: error.message, life: 5000});
  } finally {
    submitting.value = false;
  }
}

onMounted(() => tagsStore.load());
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
        <Form v-slot="$form" :initialValues="initialValues" :resolver="resolver" :validateOnValueUpdate="false"
              :validateOnBlur="true" @submit="onFormSubmit" class="space-y-6">
          <div class="space-y-2">
            <label for="name">Name</label>
            <InputText id="name" name="name" placeholder="How others will see you" fluid autocomplete="name"/>
            <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
              {{ $form.name.error?.message }}
            </Message>
          </div>

          <div class="space-y-2">
            <label for="email">Email</label>
            <InputText id="email" name="email" type="email" placeholder="name@example.com" fluid autocomplete="email"/>
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
              {{ $form.email.error?.message }}
            </Message>
          </div>

          <div class="space-y-2">
            <label for="password">Password</label>
            <Password inputId="password" name="password" :feedback="false" toggleMask fluid
                      :placeholder="`At least ${PASSWORD_MIN_LENGTH} characters`" autocomplete="new-password"/>
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
              {{ $form.password.error?.message }}
            </Message>
          </div>

          <div class="grid grid-cols-2 gap-4 two-columns">
            <div class="space-y-2">
              <label for="birthDate">Birth date</label>
              <DatePicker inputId="birthDate" name="birthDate" :maxDate="maxBirthDate" dateFormat="dd.mm.yy"
                          placeholder="dd.mm.yyyy" showIcon fluid/>
              <Message v-if="$form.birthDate?.invalid" severity="error" size="small" variant="simple">
                {{ $form.birthDate.error?.message }}
              </Message>
            </div>

            <div class="space-y-2">
              <label for="gender">Gender</label>
              <Select inputId="gender" name="gender" :options="GENDERS" optionLabel="label" optionValue="value"
                      placeholder="Select" fluid/>
              <Message v-if="$form.gender?.invalid" severity="error" size="small" variant="simple">
                {{ $form.gender.error?.message }}
              </Message>
            </div>
          </div>

          <div class="space-y-2">
            <label for="bio">About you <span class="optional">(optional)</span></label>
            <Textarea id="bio" name="bio" rows="3" autoResize :maxlength="BIO_MAX_LENGTH" fluid
                      placeholder="What should people know about you?"/>
            <Message v-if="$form.bio?.invalid" severity="error" size="small" variant="simple">
              {{ $form.bio.error?.message }}
            </Message>
          </div>

          <div class="space-y-2">
            <label for="interests">Interests</label>
            <MultiSelect inputId="interests" name="interests" :options="tagsStore.options(TagCategory.INTEREST)"
                         optionLabel="label" optionValue="value" filter display="chip"
                         :selectionLimit="MAX_TAGS_PER_CATEGORY" placeholder="Select your interests" fluid/>
          </div>

          <div class="space-y-2">
            <label for="hobbies">Hobbies</label>
            <MultiSelect inputId="hobbies" name="hobbies" :options="tagsStore.options(TagCategory.HOBBY)"
                         optionLabel="label" optionValue="value" filter display="chip"
                         :selectionLimit="MAX_TAGS_PER_CATEGORY" placeholder="Select your hobbies" fluid/>
          </div>

          <div class="space-y-2">
            <label>Address</label>
            <p class="hint">Only your city is shown to others. We use your zip code to find people nearby.</p>
            <div class="address-container space-y-4">
              <div class="space-y-2">
                <label for="street">Street and number <span class="optional">(optional)</span></label>
                <InputGroup>
                  <InputGroupAddon><i class="pi pi-home"></i></InputGroupAddon>
                  <InputText id="street" name="street" placeholder="Main Street 1" fluid autocomplete="street-address"/>
                </InputGroup>
              </div>

              <div class="grid grid-cols-2 gap-4 two-columns">
                <div class="space-y-2">
                  <label for="zipCode">Zip code</label>
                  <InputGroup>
                    <InputGroupAddon><i class="pi pi-hashtag"></i></InputGroupAddon>
                    <InputText id="zipCode" name="zipCode" placeholder="20095" fluid autocomplete="postal-code"/>
                  </InputGroup>
                  <Message v-if="$form.zipCode?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.zipCode.error?.message }}
                  </Message>
                </div>

                <div class="space-y-2">
                  <label for="city">City</label>
                  <InputGroup>
                    <InputGroupAddon><i class="pi pi-building"></i></InputGroupAddon>
                    <InputText id="city" name="city" placeholder="Hamburg" fluid autocomplete="address-level2"/>
                  </InputGroup>
                  <Message v-if="$form.city?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.city.error?.message }}
                  </Message>
                </div>
              </div>

              <div class="space-y-2">
                <label for="country">Country</label>
                <InputGroup>
                  <InputGroupAddon><i class="pi pi-globe"></i></InputGroupAddon>
                  <InputText id="country" name="country" placeholder="DE" fluid autocomplete="country"/>
                </InputGroup>
                <Message v-if="$form.country?.invalid" severity="error" size="small" variant="simple">
                  {{ $form.country.error?.message }}
                </Message>
              </div>
            </div>
          </div>

          <div class="pt-4">
            <Button type="submit" label="Register" :loading="submitting" class="w-full py-3 text-base font-medium"/>
          </div>
        </Form>

        <div class="mt-6 text-center">
          <span class="text-sm">Already have an account? </span>
          <Button label="Sign in here" link @click="router.push('/login')" class="text-sm font-medium"/>
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

label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.optional,
.hint {
  font-weight: 400;
  font-size: 0.8rem;
  color: rgba(235, 235, 235, 0.55);
}

.hint {
  margin: 0;
}

:deep(.p-button) {
  width: 100%;
  justify-content: center;
}

:deep(.p-message) {
  margin-top: 0.25rem;
}

.form-container {
  max-width: 1000px;
  margin: 0 auto;
}

.two-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.address-container {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--p-primary-color);
}

@media (max-width: 480px) {
  .two-columns {
    grid-template-columns: 1fr;
  }
}
</style>
