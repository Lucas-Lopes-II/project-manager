import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'projects',
      component: () => import('@/features/projects/pages/ProjectListPage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'projects' },
    },
  ],
})

export default router
