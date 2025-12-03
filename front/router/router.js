import { createRouter, createWebHistory } from 'vue-router';
/* import AppAuth from '../components/pages/Auth.vue' */
/* import HomePage from '../pages/HomePage.vue' */

const router = createRouter({
  history: createWebHistory(),
  routes: [
    /* { path: '/', component: AuthPage }, */
    /* { path: '/', component: HomePage, meta: { requiresAuth: true } } */
  ]
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('jwt');

  if (to.meta.requiresAuth && !token) {
    next('/');
  } else {
    next();
  }
});

export default router;
