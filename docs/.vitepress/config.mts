import { defineConfig } from 'vitepress'

const zhGuideSidebar = [
  {
    text: '指南',
    items: [
      { text: '部署指南', link: '/guide/deployment' },
      { text: '配置指南', link: '/guide/configuration' },
      { text: '使用指南', link: '/guide/usage' },
      { text: '开发指南', link: '/guide/development' },
      { text: '常见问题', link: '/guide/faq' }
    ]
  }
]

const enGuideSidebar = [
  {
    text: 'Basic Guide',
    items: [
      { text: 'Deployment Guide', link: '/en/guide/deployment' },
      { text: 'Configuration Guide', link: '/en/guide/configuration' },
      { text: 'Usage Guide', link: '/en/guide/usage' },
      { text: 'Development Guide', link: '/en/guide/development' },
      { text: 'FAQ', link: '/en/guide/faq' }
    ]
  }
]

export default defineConfig({
  title: "PurrCat",
  description: "PurrCat 官方文档",
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }]
  ],
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/PurrPod/purrcat' }
    ],
    footer: {
      copyright: '© 2026 PurrCat. Licensed under MIT.'
    }
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '介绍', link: '/intro' },
          { text: '指南', link: '/guide/deployment' },
          { text: '生态', link: '/community/' }
        ],
        sidebar: {
          '/guide/': zhGuideSidebar,
          '/community/': [
            {
              text: '社区生态',
              items: [
                { text: '生态指南', link: '/community/' }
              ]
            }
          ]
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Introduction', link: '/en/intro' },
          { text: 'Guide', link: '/en/guide/deployment' },
          { text: 'Community', link: '/en/community/' }
        ],
        sidebar: {
          '/en/guide/': enGuideSidebar,
          '/en/community/': [
            {
              text: 'Community',
              items: [
                { text: 'Ecosystem', link: '/en/community/' }
              ]
            }
          ]
        }
      }
    }
  }
})
