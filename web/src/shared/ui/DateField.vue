<script setup lang="ts">
import FormField from './FormField.vue'

const model = defineModel<string>({ required: true })

defineProps<{
  label: string
  /** Address of the icon from the design, shown where the browser allows replacing its own. */
  icon: string
  required?: boolean
  error?: string
}>()

defineEmits<{ blur: [] }>()
</script>

<template>
  <FormField
    v-slot="{ id, describedBy, invalid }"
    :label="label"
    :required="required"
    :error="error"
  >
    <div class="date">
      <!-- The limit keeps the year with four digits while typing. -->
      <input
        :id="id"
        v-model="model"
        class="control input"
        :class="{ empty: !model }"
        type="date"
        max="9999-12-31"
        :required="required"
        :aria-invalid="invalid"
        :aria-describedby="describedBy"
        @blur="$emit('blur')"
      />
      <img class="icon" :src="icon" alt="" width="24" height="24" />
    </div>
  </FormField>
</template>

<style scoped>
.date {
  position: relative;
}

/* The invisible native icon covers the field, so a click anywhere opens the calendar. */
.input::-webkit-calendar-picker-indicator {
  position: absolute;
  inset: 0;
  width: auto;
  height: auto;
  opacity: 0;
  cursor: pointer;
}

.icon {
  display: none;
  position: absolute;
  top: 8px;
  right: 8px;
  pointer-events: none;
}

/* Other browsers keep their own icon and format, because the icon disappears with the text there. */
@supports selector(::-webkit-calendar-picker-indicator) {
  .icon {
    display: block;
  }

  /* An empty field stays blank, as in the design, and shows the format when focused. */
  .input.empty:not(:focus) {
    color: transparent;
  }
}
</style>
