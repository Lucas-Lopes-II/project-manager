<script setup lang="ts">
import { computed } from 'vue'

import calendarCheckIcon from '@/shared/assets/icons/calendar-check.svg'
import calendarDayIcon from '@/shared/assets/icons/calendar-day.svg'
import editIcon from '@/shared/assets/icons/edit.svg'
import trashIcon from '@/shared/assets/icons/trash-menu.svg'
import starFilledIcon from '@/shared/assets/icons/star-filled.svg'
import starOutlineIcon from '@/shared/assets/icons/star-outline.svg'
import placeholder from '@/shared/assets/project-placeholder.svg'
import ActionMenu from '@/shared/ui/ActionMenu.vue'
import ActionMenuItem from '@/shared/ui/ActionMenuItem.vue'

import type { Project } from '../api'
import { formatDate } from '../formatDate'

const props = defineProps<{ project: Project }>()

defineEmits<{
  remove: [project: Project]
  toggleFavorite: [project: Project]
}>()

const dates = computed(() => [
  { label: 'Início', value: props.project.start_date, icon: calendarDayIcon },
  { label: 'Prazo', value: props.project.end_date, icon: calendarCheckIcon },
])
</script>

<template>
  <article class="card" :data-project-id="project.id">
    <div class="media">
      <img class="cover" :src="project.cover_url ?? placeholder" alt="" loading="lazy" />
      <div class="actions">
        <button
          class="favorite"
          type="button"
          :aria-label="`Favoritar ${project.name}`"
          :aria-pressed="project.favorite"
          @click="$emit('toggleFavorite', project)"
        >
          <img
            :src="project.favorite ? starFilledIcon : starOutlineIcon"
            alt=""
            width="29"
            height="29"
          />
        </button>
        <ActionMenu :label="`Ações do projeto ${project.name}`">
          <ActionMenuItem
            :to="{ name: 'project-edit', params: { id: project.id } }"
            :icon="editIcon"
          >
            Editar
          </ActionMenuItem>
          <ActionMenuItem :icon="trashIcon" @click="$emit('remove', project)"
            >Remover</ActionMenuItem
          >
        </ActionMenu>
      </div>
    </div>

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
}

.media {
  position: relative;
}

.cover {
  width: 100%;
  aspect-ratio: 346 / 232;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  object-fit: cover;
}

.actions {
  display: flex;
  position: absolute;
  right: 16px;
  bottom: 16px;
  align-items: center;
  gap: 18px;
}

/* A 32 px target around the 20 px star of the design. The image includes the shadow. */
.favorite {
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;

  img {
    position: absolute;
    top: 6px;
    left: 1.5px;
    max-width: none;
  }
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
