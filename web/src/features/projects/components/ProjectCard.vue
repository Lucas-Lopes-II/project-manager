<script setup lang="ts">
import { computed } from 'vue'

import calendarCheckIcon from '@/shared/assets/icons/calendar-check.svg'
import calendarDayIcon from '@/shared/assets/icons/calendar-day.svg'
import placeholder from '@/shared/assets/project-placeholder.svg'

import type { Project } from '../api'
import { formatDate } from '../formatDate'

const props = defineProps<{ project: Project }>()

const dates = computed(() => [
  { label: 'Início', value: props.project.start_date, icon: calendarDayIcon },
  { label: 'Prazo', value: props.project.end_date, icon: calendarCheckIcon },
])
</script>

<template>
  <article class="card">
    <img class="cover" :src="project.cover_url ?? placeholder" alt="" loading="lazy" />

    <div class="body">
      <h2 class="name" :title="project.name">{{ project.name }}</h2>
      <p class="client" :title="project.client">
        <strong class="client-label">Cliente:</strong> {{ project.client }}
      </p>

      <ul class="dates">
        <li v-for="date in dates" :key="date.label" class="date">
          <img :src="date.icon" alt="" width="24" height="24" />
          <span class="visually-hidden">{{ date.label }}:</span>
          <time :datetime="date.value">{{ formatDate(date.value) }}</time>
        </li>
      </ul>
    </div>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--radius-card);
}

.cover {
  width: 100%;
  aspect-ratio: 346 / 232;
  object-fit: cover;
}

.body {
  flex: 1;
  padding: 24px 23px 22px;
  border: 1px solid var(--color-border-card);
  border-top: 0;
  border-radius: 0 0 var(--radius-card) var(--radius-card);
  background: var(--color-surface);
  color: var(--color-text-muted);
}

.name,
.client {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  color: var(--color-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  line-height: 30px;
}

.client {
  margin-top: 5px;
  line-height: 20px;
}

.client-label {
  margin-right: 4px;
  font-weight: var(--font-weight-bold);
}

.dates {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 16px 0 0;
  padding: 15px 0 0;
  border-top: 1px solid var(--color-divider);
  list-style: none;
}

.date {
  display: flex;
  align-items: center;
  gap: 16px;
  line-height: 24px;
}
</style>
