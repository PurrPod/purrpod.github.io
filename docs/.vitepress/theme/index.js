import DefaultTheme from 'vitepress/theme'
import './style.css'
import confetti from 'canvas-confetti'
import { watch } from 'vue'
import EcoPage from './components/EcoPage.vue'
import MarqueeCards from './components/MarqueeCards.vue'
import MarqueeCardsEn from './components/MarqueeCardsEn.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    app.component('EcoPage', EcoPage)
    app.component('MarqueeCards', MarqueeCards)
    app.component('MarqueeCardsEn', MarqueeCardsEn)
    if (typeof window !== 'undefined') {
      let observer = null

      const initScrollAnimation = () => {
        if (observer) {
          observer.disconnect()
        }
        
        const caseTexts = document.querySelectorAll('.case-text')
        if (caseTexts.length === 0) return

        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('animate')
                observer.unobserve(entry.target)
              }
            })
          },
          {
            threshold: 0.3
          }
        )

        caseTexts.forEach((el) => {
          observer.observe(el)
        })
      }

      watch(() => router.route.data.relativePath, (path, oldPath) => {
        if (oldPath) {
          const oldCaseTexts = document.querySelectorAll('.case-text')
          oldCaseTexts.forEach((el) => {
            el.classList.remove('animate')
          })
        }
        
        if (path === 'index.md' || path === 'en/index.md') {
          setTimeout(() => {
            confetti({
              particleCount: 80,
              spread: 100,
              origin: { y: 0.6 },
              colors: ['#a8c0ff', '#3f2b96', '#ffffff', '#ff7eb3'],
              disableForReducedMotion: true
            });
            initScrollAnimation()
          }, 300);
        }
      }, { immediate: true });
    }
  }
}