import { createRouter, createWebHistory } from 'vue-router'
import Game from '../views/Game.vue'
import Init from '../views/Init.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Init,
    },
    {
      path: '/play',
      name: 'game',
      component: Game
    }
  ],
})

export default router
