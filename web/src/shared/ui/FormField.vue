<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  required?: boolean
  error?: string
}>()

const id = useId()
const errorId = `${id}-error`
</script>

<template>
  <div class="field" :class="{ invalid: error }">
    <label class="label" :for="id">
      {{ label }}
      <span v-if="required" class="required">(Obrigatório)</span>
    </label>
    <slot :id="id" :described-by="error ? errorId : undefined" :invalid="Boolean(error)" />
    <p v-if="error" :id="errorId" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.label {
  display: flex;
  gap: 8px;
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  line-height: 22px;
}

.required {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
}

.error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  line-height: 22px;
}

/* The inputs live in other components, but they share this look and its error state. */
.field :deep(.control) {
  width: 100%;
  height: 40px;
  padding-inline: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  line-height: 22px;
}

.invalid .label {
  color: var(--color-error-label);
}

.invalid .required {
  color: var(--color-error);
}

.invalid :deep(.control) {
  border-color: var(--color-error);
  color: var(--color-error);
}
</style>
