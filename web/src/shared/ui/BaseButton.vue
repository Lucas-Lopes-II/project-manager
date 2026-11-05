<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    /** Renders a link to this route instead of a button. */
    to?: RouteLocationRaw
    type?: 'button' | 'submit'
    size?: 'large' | 'small'
    variant?: 'primary' | 'outline'
  }>(),
  { to: undefined, type: 'button', size: 'large', variant: 'primary' },
)
</script>

<template>
  <RouterLink v-if="to" class="button" :class="[size, variant]" :to="to"><slot /></RouterLink>
  <button v-else class="button" :class="[size, variant]" :type="type"><slot /></button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-pill);
  text-decoration: none;
}

.large {
  gap: 16px;
  min-width: 230px;
  height: 52px;
  padding-inline: 32px;
  font-size: var(--font-size-xl);
  line-height: 22px;
}

.small {
  gap: 8px;
  min-width: 144px;
  height: 40px;
  padding-inline: 24px;
  font-size: var(--font-size-md);
  line-height: 24px;
}

.primary {
  background: var(--color-primary);
  color: var(--color-surface);

  &:disabled {
    background: var(--color-primary-disabled);
    cursor: not-allowed;
  }
}

.outline {
  border: 1px solid var(--color-primary);
  background: var(--color-surface);
  color: var(--color-primary);

  &:disabled {
    border-color: var(--color-primary-disabled);
    color: var(--color-primary-disabled);
    cursor: not-allowed;
  }
}
</style>
