<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="toggle">
    <input v-model="model" class="input visually-hidden" type="checkbox" role="switch" />
    <span class="track" aria-hidden="true"><span class="thumb" /></span>
    <span class="label"><slot /></span>
  </label>
</template>

<style scoped>
.toggle {
  display: inline-flex;
  position: relative;
  align-items: center;
  gap: 8px;
  color: var(--color-text);
  line-height: 22px;
  cursor: pointer;
}

.track {
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 24px;
  border-radius: 12px;
  background: var(--color-toggle-off);
  transition: background-color 150ms;
}

.thumb {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-surface);
  transition: transform 150ms;
}

.input:checked + .track {
  background: var(--color-accent);

  .thumb {
    transform: translateX(24px);
  }
}

.input:focus-visible + .track {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .track,
  .thumb {
    transition: none;
  }
}
</style>
