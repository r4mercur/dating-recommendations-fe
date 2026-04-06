<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import Button from 'primevue/button'
import { useUserStore } from '@/stores/user.js'

const emit = defineEmits(['close', 'uploaded'])

const userStore = useUserStore()

const selectedFile = ref(null)
const previewUrl = ref('')
const loading = ref(false)
const errorMessage = ref('')

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const canUpload = computed(() => !!selectedFile.value && !loading.value)

function closeModal() {
  if (loading.value) return
  cleanupPreview()
  selectedFile.value = null
  errorMessage.value = ''
  emit('close')
}

function cleanupPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

function onFileChange(event) {
  errorMessage.value = ''
  const file = event.target.files?.[0]
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    errorMessage.value = 'Nur JPG, PNG oder WEBP sind erlaubt.'
    event.target.value = ''
    return
  }

  if (file.size > MAX_SIZE_BYTES) {
    errorMessage.value = 'Datei ist zu groß. Maximal 5 MB.'
    event.target.value = ''
    return
  }

  selectedFile.value = file
  cleanupPreview()
  previewUrl.value = URL.createObjectURL(file)
}

async function upload() {
  if (!selectedFile.value || loading.value) return
  errorMessage.value = ''
  loading.value = true

  try {
    const result = await userStore.uploadAvatar(selectedFile.value)

    // Fallback falls Store ein Error-Objekt zurückgibt statt zu throwen
    if (result instanceof Error) {
      throw result
    }

    emit('uploaded', result)
    closeModal()
  } catch (error) {
    errorMessage.value = error?.message || 'Upload fehlgeschlagen.'
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  cleanupPreview()
})
</script>

<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Profilbild hochladen</h3>
        <Button
            icon="pi pi-times"
            class="p-button-text p-button-plain close-button"
            :disabled="loading"
            @click="closeModal"
        />
      </div>

      <div class="modal-body">
        <div class="preview-wrapper">
          <img
              v-if="previewUrl"
              :src="previewUrl"
              alt="Vorschau Profilbild"
              class="preview-image"
          />
          <div v-else class="preview-placeholder">
            <i class="pi pi-image"></i>
            <span>Keine Datei ausgewählt</span>
          </div>
        </div>

        <label for="avatar-file" class="file-label">
          Bild auswählen
        </label>
        <input
            id="avatar-file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="file-input"
            :disabled="loading"
            @change="onFileChange"
        />

        <p class="hint">Erlaubt: JPG, PNG, WEBP · Max: 5 MB</p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="modal-actions">
          <Button
              label="Abbrechen"
              icon="pi pi-times"
              class="p-button-secondary"
              :disabled="loading"
              @click="closeModal"
          />
          <Button
              label="Hochladen"
              icon="pi pi-upload"
              :loading="loading"
              :disabled="!canUpload"
              @click="upload"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 520px;
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border: 1px solid #34495e;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #34495e;
}

.modal-header h3 {
  margin: 0;
  color: rgba(235, 235, 235, 0.9);
}

.close-button {
  color: rgb(224, 45, 45) !important;
}

.modal-body {
  padding: 20px;
}

.preview-wrapper {
  width: 100%;
  height: 220px;
  border: 1px dashed rgba(235, 235, 235, 0.35);
  border-radius: 10px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  color: rgba(235, 235, 235, 0.64);
  display: flex;
  gap: 8px;
  align-items: center;
}

.file-label {
  display: inline-block;
  margin-bottom: 8px;
  color: rgba(235, 235, 235, 0.9);
  cursor: pointer;
}

.file-input {
  width: 100%;
  margin-bottom: 8px;
}

.hint {
  margin: 0;
  color: rgba(235, 235, 235, 0.55);
  font-size: 13px;
}

.error-message {
  margin-top: 10px;
  color: #ef5350;
  font-size: 14px;
}

.modal-actions {
  margin-top: 18px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
