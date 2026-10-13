<script setup>
import {useToast} from '@/composables/useToast.js'

const {toasts, remove} = useToast()

const ICONS = {success: 'icon-check', info: 'icon-info-circle', warn: 'icon-info-circle', error: 'icon-times'}
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.severity"
           :role="toast.severity === 'error' ? 'alert' : 'status'">
        <i class="icon" :class="ICONS[toast.severity]" aria-hidden="true"></i>
        <div class="toast-text">
          <span class="toast-summary">{{ toast.summary }}</span>
          <span v-if="toast.detail" class="toast-detail">{{ toast.detail }}</span>
        </div>
        <button type="button" class="toast-close" aria-label="Close" @click="remove(toast.id)">
          <i class="icon icon-times" aria-hidden="true"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1400;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(25rem, calc(100vw - 40px));
  pointer-events: none;
}

.toast {
  --tone: 59, 130, 246;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(var(--tone), 0.35);
  border-radius: 6px;
  color: rgb(var(--tone));
  background: linear-gradient(rgba(var(--tone), 0.16), rgba(var(--tone), 0.16)), var(--ui-surface-900);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  pointer-events: auto;
}

.toast.success {
  --tone: 34, 197, 94;
}

.toast.warn {
  --tone: 234, 179, 8;
}

.toast.error {
  --tone: 239, 68, 68;
}

.toast > .icon {
  margin-top: 0.2em;
  font-size: 1.15rem;
}

.toast-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.toast-summary {
  font-weight: 500;
}

.toast-detail {
  font-size: 0.9rem;
  opacity: 0.9;
}

.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 50%;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.12);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
