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
{ path: '/pathName', component: () => import('./pages/PageIWantToAddToRoutes.vue')
 */
const routes = [
  { path: '/', component: () => import('./pages/PageHome.vue') },
  { path: '/imateapot', component: () => import('./pages/PageError418.vue') },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('./pages/PageError404.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

const vuetify = createVuetify({
  components,
  directives
});

createApp(App).use(router).use(vuetify).mount('#app');
