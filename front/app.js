// Vue
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Components
import App from './App.vue';

/* 
Routes need to always follow the template:
{ path: '/pathName', component: () => import('./pages/PageIWantToAddToRoutes.vue') }
 */
const routes = [
  { path: '/', component: () => import('./pages/PageHome.vue'), meta: { requiresAuth: true } },
  { path: '/friendlist', component: () => import('./pages/PageFriendlist.vue'), meta: { requiresAuth: true } },
  { path: '/create-challenge', component: () => import('./pages/PageCreateChallenge.vue'), meta: { requiresAuth: true } },
  { path: '/profil', component: () => import('./pages/PageProfile.vue'), meta: { requiresAuth: true } },
  { path: '/authentification', component: () => import('./pages/PageAuth.vue') }
  { path: '/socials', component: () => import('./pages/PageSocials.vue') }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard pour l'authentification
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('jwt');

  if (to.meta.requiresAuth && !token) {
    next('/authentification');
  } else if (to.path === '/authentification' && token) {
    next('/');
  } else {
    next();
  }
});

const vuetify = createVuetify({
  components,
  directives
});

createApp(App).use(router).use(vuetify).mount('#app');
