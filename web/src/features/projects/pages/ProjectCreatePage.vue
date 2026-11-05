<script setup lang="ts">
import { createProject } from '../api'
import ProjectForm from '../components/ProjectForm.vue'
import ProjectFormLayout from '../components/ProjectFormLayout.vue'
import { useSaveProject } from '../useSaveProject'

const { saving, serverErrors, failure, submit, clearErrors } = useSaveProject(createProject)
</script>

<template>
  <ProjectFormLayout title="Novo projeto">
    <ProjectForm
      :saving="saving"
      :server-errors="serverErrors"
      :failure="failure"
      @submit="submit"
      @change="clearErrors"
    />
  </ProjectFormLayout>
</template>
