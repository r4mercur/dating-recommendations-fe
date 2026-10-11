<script setup>
import {ref} from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: null
  },
  /** saves the draft; a thrown error is shown in the section and keeps the editor open */
  save: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['edit'])

const editing = ref(false)
const saving = ref(false)
const error = ref(null)

function startEdit() {
  error.value = null
  emit('edit')
  editing.value = true
}

async function submit() {
  saving.value = true
  error.value = null
  try {
    await props.save()
    editing.value = false
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="info-card" :class="{editing}">
    <header class="section-header">
      <h3><i v-if="icon" :class="['pi', icon]" aria-hidden="true"></i>{{ title }}</h3>
      <button v-if="save && !editing" class="section-edit" type="button" @click="startEdit">
        <i class="pi pi-pencil" aria-hidden="true"></i> Edit
      </button>
    </header>

    <form v-if="editing" class="section-form" @submit.prevent="submit" @keydown.esc="editing = false">
      <slot name="edit"/>
      <p v-if="error" class="section-error" role="alert">{{ error }}</p>
      <div class="section-actions">
        <button type="button" class="btn-ghost" @click="editing = false">Cancel</button>
        <button type="submit" class="btn-save" :disabled="saving">
          <i v-if="saving" class="pi pi-spin pi-spinner" aria-hidden="true"></i> Save
        </button>
      </div>
    </form>
    <slot v-else/>
  </section>
</template>

<style scoped>
.info-card {
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #34495e;
  transition: border-color .2s ease;
}

.info-card.editing {
  border-color: #ffa726;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: rgba(235, 235, 235, 0.8);
}

.section-header h3 i {
  color: #ffa726;
}

.section-edit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #34495e;
  border-radius: 6px;
  font-size: 13px;
  color: rgba(235, 235, 235, 0.8);
  background: transparent;
  cursor: pointer;
}

.section-edit:hover {
  border-color: #ffa726;
  color: #ffa726;
}

.section-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-error {
  margin: 0;
  font-size: 14px;
  color: #f7a1a1;
}

.section-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-ghost,
.btn-save {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-ghost {
  color: rgba(235, 235, 235, 0.8);
  background: transparent;
  border: 1px solid #34495e;
}

.btn-save {
  color: #2c3e50;
  background: #ffa726;
  border: none;
}

.btn-save:disabled {
  opacity: .7;
  cursor: progress;
}
</style>
