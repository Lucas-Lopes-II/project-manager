import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** The search only exists on the lists, as in the design. */
    hideSearch?: boolean
    /** The title of the page in the browser tab, before the name of the application. */
    title?: string
  }
}

export const APP_NAME = 'Gerenciador de Projetos'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'projects',
      meta: { title: 'Projetos' },
      component: () => import('@/features/projects/pages/ProjectListPage.vue'),
    },
    {
      path: '/busca',
      name: 'project-search',
      meta: { title: 'Resultado da busca' },
      component: () => import('@/features/projects/pages/ProjectSearchPage.vue'),
    },
    {
      path: '/projetos/novo',
      name: 'project-new',
      meta: { hideSearch: true, title: 'Novo projeto' },
      component: () => import('@/features/projects/pages/ProjectCreatePage.vue'),
    },
    {
      path: '/projetos/:id/editar',
      name: 'project-edit',
      meta: { hideSearch: true, title: 'Editar projeto' },
      props: true,
      component: () => import('@/features/projects/pages/ProjectEditPage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'projects' },
    },
  ],
})

// Each page has its own title, as after loading a new page (ADR-0037).
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ${APP_NAME}` : APP_NAME
})

export default router
