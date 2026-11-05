import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** The search only exists on the lists, as in the design. */
    hideSearch?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'projects',
      component: () => import('@/features/projects/pages/ProjectListPage.vue'),
    },
    {
      path: '/projetos/novo',
      name: 'project-new',
      meta: { hideSearch: true },
      component: () => import('@/features/projects/pages/ProjectCreatePage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'projects' },
    },
  ],
})

export default router
