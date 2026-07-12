import DefaultTheme from 'vitepress/theme'
import './style.css'
import confetti from 'canvas-confetti'
import { watch } from 'vue'
import EcoPage from './components/EcoPage.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    app.component('EcoPage', EcoPage)
    if (typeof window !== 'undefined') {
      watch(() => router.route.data.relativePath, (path) => {
        if (path === 'index.md') {
          setTimeout(() => {
            confetti({
              particleCount: 80,
              spread: 100,
              origin: { y: 0.6 },
              colors: ['#a8c0ff', '#3f2b96', '#ffffff', '#ff7eb3'],
              disableForReducedMotion: true
            });
          }, 300);
        }
      }, { immediate: true });
    }
  }
}