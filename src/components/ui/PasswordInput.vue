<script setup>
import {ref} from 'vue'

defineOptions({inheritAttrs: false})

const model = defineModel({type: String, default: ''})
const visible = ref(false)
</script>

<template>
  <div class="password">
    <input v-bind="$attrs" v-model="model" class="input" :type="visible ? 'text' : 'password'"/>
    <button type="button" class="toggle" :aria-label="visible ? 'Hide password' : 'Show password'"
            :aria-pressed="visible" @click="visible = !visible">
      <i class="icon" :class="visible ? 'icon-eye-slash' : 'icon-eye'" aria-hidden="true"></i>
    </button>
  </div>
</template>

<style scoped>
.password {
  position: relative;
}

.password .input {
  padding-right: 2.5rem;
}

.toggle {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  display: flex;
  padding: 0;
  border: none;
  color: var(--ui-surface-400);
  background: none;
  cursor: pointer;
  transform: translateY(-50%);
}

.toggle:hover {
  color: var(--ui-surface-0);
}
</style>
