<script setup lang="ts">
import FormField from './FormField.vue'

const model = defineModel<string>({ required: true })

defineProps<{
  label: string
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
    <input
      :id="id"
      v-model="model"
      class="control"
      type="text"
      autocomplete="off"
      :required="required"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @blur="$emit('blur')"
    />
  </FormField>
</template>
