import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Projects from '../views/Projects.vue'
import Contact from '../views/Contact.vue'

const isProduction = import.meta.env.PROD
const base = isProduction ? '/imorlab-portfolio/' : '/'

const router = createRouter({
  history: createWebHistory(base),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      alias: '/home'
    },
    {
      path: '/about',
      name: 'About',
      component: About
    },
    {
      path: '/projects',
      name: 'Projects',
      component: Projects
    },
    {
      path: '/contact',
      name: 'Contact',
      component: Contact
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

export default router
