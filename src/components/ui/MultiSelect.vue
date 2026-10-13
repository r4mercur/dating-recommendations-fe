<script setup>
import {computed, onBeforeUnmount, ref, watch} from 'vue'

const props = defineProps({
  /** [{label, value}] */
  options: {type: Array, default: () => []},
  placeholder: {type: String, default: 'Select'},
  /** adds a search field above the options */
  filter: {type: Boolean, default: false},
  /** maximum number of selected options */
  selectionLimit: {type: Number, default: null},
  inputId: {type: String, default: null},
  invalid: {type: Boolean, default: false},
})

const model = defineModel({type: Array, default: () => []})

const root = ref(null)
const search = ref('')
const open = ref(false)

const selected = computed(() => props.options.filter(option => model.value.includes(option.value)))
const visible = computed(() => {
  const query = search.value.trim().toLowerCase()
  return query ? props.options.filter(option => option.label.toLowerCase().includes(query)) : props.options
})
const limitReached = computed(() => props.selectionLimit != null && model.value.length >= props.selectionLimit)

function toggle(option) {
  model.value = model.value.includes(option.value)
      ? model.value.filter(value => value !== option.value)
      : [...model.value, option.value]
}

function remove(option) {
  model.value = model.value.filter(value => value !== option.value)
}

function close() {
  open.value = false
  search.value = ''
}

function onOutsidePointer(event) {
  if (!root.value?.contains(event.target)) close()
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onOutsidePointer)
  else document.removeEventListener('pointerdown', onOutsidePointer)
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutsidePointer))
</script>

<template>
  <div ref="root" class="multiselect" @keydown.esc.stop="close">
    <div class="trigger" :class="{open, invalid}">
      <div class="chips">
        <span v-for="option in selected" :key="option.value" class="chip">
          {{ option.label }}
          <button type="button" class="chip-remove" :aria-label="`Remove ${option.label}`" @click="remove(option)">
            <i class="icon icon-times" aria-hidden="true"></i>
          </button>
        </span>
        <span v-if="!selected.length" class="placeholder">{{ placeholder }}</span>
      </div>
      <button :id="inputId" type="button" class="toggle" aria-haspopup="listbox" :aria-expanded="open"
              aria-label="Show options" @click="open ? close() : (open = true)">
        <i class="icon icon-chevron-down" aria-hidden="true"></i>
      </button>
    </div>

    <div v-if="open" class="panel">
      <input v-if="filter" v-model="search" class="input" type="search" placeholder="Search" aria-label="Search options"
             @keydown.enter.prevent/>
      <ul class="options" role="listbox" aria-multiselectable="true">
        <li v-for="option in visible" :key="option.value">
          <label class="option" :class="{disabled: limitReached && !model.includes(option.value)}">
            <input type="checkbox" :checked="model.includes(option.value)"
                   :disabled="limitReached && !model.includes(option.value)" @change="toggle(option)"/>
            <span class="box" aria-hidden="true"><i class="icon icon-check"></i></span>
            {{ option.label }}
          </label>
        </li>
        <li v-if="!visible.length" class="empty">No results</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.multiselect {
  position: relative;
}

.trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 2.5rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--ui-surface-700);
  border-radius: var(--ui-radius);
  color: var(--ui-surface-0);
  background: var(--ui-surface-950);
  box-shadow: 0 1px 2px 0 rgba(18, 18, 23, 0.05);
  transition: border-color 0.2s;
}

.trigger:hover {
  border-color: var(--ui-surface-600);
}

.trigger.open,
.trigger:focus-within {
  border-color: var(--ui-primary);
}

.trigger.invalid {
  border-color: var(--ui-danger);
}

.chips {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.placeholder {
  padding: 0.25rem 0;
  color: var(--ui-surface-500);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.125rem 0.5rem 0.125rem 0.75rem;
  border-radius: 16px;
  font-size: 0.9rem;
  color: var(--ui-surface-0);
  background: var(--ui-surface-800);
}

.chip-remove {
  display: flex;
  padding: 2px;
  border: none;
  border-radius: 50%;
  color: var(--ui-surface-400);
  background: none;
  cursor: pointer;
}

.chip-remove:hover {
  color: var(--ui-surface-0);
}

.toggle {
  display: flex;
  padding: 4px;
  border: none;
  color: var(--ui-surface-400);
  background: none;
  cursor: pointer;
}

.open .toggle .icon {
  transform: rotate(180deg);
}

.panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--ui-surface-700);
  border-radius: var(--ui-radius);
  background: var(--ui-surface-900);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
}

.options {
  max-height: 14rem;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  color: var(--ui-surface-0);
  cursor: pointer;
}

.option:hover {
  background: var(--ui-surface-800);
}

.option.disabled {
  color: var(--ui-surface-500);
  cursor: default;
}

.option.disabled:hover {
  background: none;
}

.option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 1px solid var(--ui-surface-700);
  border-radius: 4px;
  font-size: 14px;
  color: transparent;
  background: var(--ui-surface-950);
}

.option input:checked + .box {
  border-color: var(--ui-primary);
  color: var(--ui-primary-contrast);
  background: var(--ui-primary);
}

.option input:focus-visible + .box {
  box-shadow: var(--ui-focus-ring);
}

.empty {
  padding: 0.5rem 0.75rem;
  color: var(--ui-surface-500);
}
</style>
