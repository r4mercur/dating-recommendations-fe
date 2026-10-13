<script setup>
import {onMounted, ref} from "vue";
import MultiSelect from "@/components/ui/MultiSelect.vue";
import PasswordInput from "@/components/ui/PasswordInput.vue";
import {useToast} from "@/composables/useToast.js";
import {useForm} from "@/composables/useForm.js";
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
/** latest birth date that is old enough, yyyy-MM-dd like the value of the date field */
const maxBirthDate = toIsoDate(latestBirthDate());

const initialValues = {
  name: '',
  email: '',
  password: '',
  birthDate: '',
  gender: '',
  bio: '',
  interests: [],
  hobbies: [],
  street: '',
  zipCode: '',
  city: '',
  country: 'DE',
};

const resolver = (values) => {
  const errors = {};
  const required = (field, message) => {
    if (!values[field] || (typeof values[field] === 'string' && !values[field].trim())) {
      errors[field] = message;
    }
  };

  required('name', 'Name is required.');
  required('email', 'Email is required.');
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.password || values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  required('birthDate', 'Birth date is required.');
  if (values.birthDate && values.birthDate > maxBirthDate) {
    errors.birthDate = 'You need to be at least 18.';
  }
  required('gender', 'Gender is required.');
  if ((values.bio || '').length > BIO_MAX_LENGTH) {
    errors.bio = `At most ${BIO_MAX_LENGTH} characters.`;
  }
  required('zipCode', 'Zip code is required.');
  required('city', 'City is required.');
  required('country', 'Country is required.');

  return errors;
};

const {values, errors, blur, input, handleSubmit} = useForm({initialValues, resolver});

const onFormSubmit = handleSubmit(async (values) => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await userStore.register({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      birthDate: values.birthDate,
      gender: values.gender,
      bio: values.bio?.trim() || null,
      interests: [...values.interests],
      hobbies: [...values.hobbies],
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
});

onMounted(() => tagsStore.load());
</script>

<template>
  <div class="auth-page">
    <div class="auth-inner">
      <h2 class="auth-title">Create your account</h2>

      <div class="form-container">
        <form novalidate @submit="onFormSubmit">
          <div class="field">
            <label for="name">Name</label>
            <input id="name" v-model="values.name" name="name" class="input" placeholder="How others will see you"
                   autocomplete="name" :aria-invalid="!!errors.name" @blur="blur('name')" @input="input('name')"/>
            <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label for="email">Email</label>
            <input id="email" v-model="values.email" name="email" type="email" class="input"
                   placeholder="name@example.com" autocomplete="email" :aria-invalid="!!errors.email"
                   @blur="blur('email')" @input="input('email')"/>
            <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
          </div>

          <div class="field">
            <label for="password">Password</label>
            <PasswordInput id="password" v-model="values.password" name="password"
                           :placeholder="`At least ${PASSWORD_MIN_LENGTH} characters`" autocomplete="new-password"
                           :aria-invalid="!!errors.password" @blur="blur('password')" @input="input('password')"/>
            <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
          </div>

          <div class="two-columns">
            <div class="field">
              <label for="birthDate">Birth date</label>
              <input id="birthDate" v-model="values.birthDate" name="birthDate" type="date" class="input"
                     :max="maxBirthDate" :aria-invalid="!!errors.birthDate"
                     @blur="blur('birthDate')" @input="input('birthDate')"/>
              <p v-if="errors.birthDate" class="field-error">{{ errors.birthDate }}</p>
            </div>

            <div class="field">
              <label for="gender">Gender</label>
              <select id="gender" v-model="values.gender" name="gender" class="select"
                      :aria-invalid="!!errors.gender" @blur="blur('gender')" @change="input('gender')">
                <option value="" disabled>Select</option>
                <option v-for="gender in GENDERS" :key="gender.value" :value="gender.value">{{ gender.label }}</option>
              </select>
              <p v-if="errors.gender" class="field-error">{{ errors.gender }}</p>
            </div>
          </div>

          <div class="field">
            <label for="bio">About you <span class="optional">(optional)</span></label>
            <textarea id="bio" v-model="values.bio" name="bio" rows="3" class="textarea" :maxlength="BIO_MAX_LENGTH"
                      placeholder="What should people know about you?" :aria-invalid="!!errors.bio"
                      @blur="blur('bio')" @input="input('bio')"></textarea>
            <p v-if="errors.bio" class="field-error">{{ errors.bio }}</p>
          </div>

          <div class="field">
            <label for="interests">Interests</label>
            <MultiSelect v-model="values.interests" input-id="interests"
                         :options="tagsStore.options(TagCategory.INTEREST)" filter
                         :selection-limit="MAX_TAGS_PER_CATEGORY" placeholder="Select your interests"/>
          </div>

          <div class="field">
            <label for="hobbies">Hobbies</label>
            <MultiSelect v-model="values.hobbies" input-id="hobbies" :options="tagsStore.options(TagCategory.HOBBY)"
                         filter :selection-limit="MAX_TAGS_PER_CATEGORY" placeholder="Select your hobbies"/>
          </div>

          <div class="field">
            <label>Address</label>
            <p class="hint">Only your city is shown to others. We use your zip code to find people nearby.</p>
            <div class="address-container">
              <div class="field">
                <label for="street">Street and number <span class="optional">(optional)</span></label>
                <div class="input-group">
                  <span class="input-addon"><i class="icon icon-home" aria-hidden="true"></i></span>
                  <input id="street" v-model="values.street" name="street" class="input" placeholder="Main Street 1"
                         autocomplete="street-address"/>
                </div>
              </div>

              <div class="two-columns">
                <div class="field">
                  <label for="zipCode">Zip code</label>
                  <div class="input-group">
                    <span class="input-addon"><i class="icon icon-hashtag" aria-hidden="true"></i></span>
                    <input id="zipCode" v-model="values.zipCode" name="zipCode" class="input" placeholder="20095"
                           autocomplete="postal-code" :aria-invalid="!!errors.zipCode"
                           @blur="blur('zipCode')" @input="input('zipCode')"/>
                  </div>
                  <p v-if="errors.zipCode" class="field-error">{{ errors.zipCode }}</p>
                </div>

                <div class="field">
                  <label for="city">City</label>
                  <div class="input-group">
                    <span class="input-addon"><i class="icon icon-building" aria-hidden="true"></i></span>
                    <input id="city" v-model="values.city" name="city" class="input" placeholder="Hamburg"
                           autocomplete="address-level2" :aria-invalid="!!errors.city"
                           @blur="blur('city')" @input="input('city')"/>
                  </div>
                  <p v-if="errors.city" class="field-error">{{ errors.city }}</p>
                </div>
              </div>

              <div class="field">
                <label for="country">Country</label>
                <div class="input-group">
                  <span class="input-addon"><i class="icon icon-globe" aria-hidden="true"></i></span>
                  <input id="country" v-model="values.country" name="country" class="input" placeholder="DE"
                         autocomplete="country" :aria-invalid="!!errors.country"
                         @blur="blur('country')" @input="input('country')"/>
                </div>
                <p v-if="errors.country" class="field-error">{{ errors.country }}</p>
              </div>
            </div>
          </div>

          <div class="submit">
            <button type="submit" class="btn btn-block" :disabled="submitting">
              <i v-if="submitting" class="icon icon-spin icon-spinner" aria-hidden="true"></i>
              Register
            </button>
          </div>
        </form>

        <div class="switch">
          <span>Already have an account? </span>
          <button type="button" class="btn btn-link" @click="router.push('/login')">Sign in here</button>
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

.field > * + * {
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

.field-error {
  margin-top: 0.25rem;
}

.address-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--ui-primary);
}

.address-container > * + * {
  margin-top: 0;
}

.two-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.submit {
  padding-top: 1.5rem;
}

.submit .btn {
  padding-block: 1rem;
  font-size: 1rem;
  font-weight: 500;
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

@media (max-width: 480px) {
  .two-columns {
    grid-template-columns: 1fr;
  }
}
</style>
