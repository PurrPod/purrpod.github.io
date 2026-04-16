import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "CatInCup",
  description: "CatInCup 官方文档",
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '介绍', link: '/intro' },
      {
        text: '下载',
        items: [
          { text: 'Git Clone', link: 'https://github.com/PurrPod/cat-in-cup' },
          { text: '下载压缩包', link: 'https://github.com/PurrPod/cat-in-cup/archive/refs/heads/main.zip' }
        ]
      },
      { text: '指南', link: '/guide/usage' },
      { text: '配置', link: '/config/' },
      { text: '开发', link: '/develop/architecture' },
      { text: '生态', link: '/community/' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '基础指南',
          items: [
            { text: '部署指南', link: '/guide/deployment' },
            { text: '使用指南', link: '/guide/usage' },
            { text: '常见问题', link: '/guide/faq' }
          ]
        }
      ],
      '/develop/': [
        {
          text: '深度开发',
          items: [
            { text: '架构介绍', link: '/develop/architecture' },
            { text: '二次开发文档', link: '/develop/extension' }
          ]
        }
      ],
      '/config/': [
        {
          text: '配置说明',
          items: [
            { text: '配置指南', link: '/config/' }
          ]
        }
      ],
      '/community/': [
        {
          text: '社区生态',
          items: [
            { text: '生态指南', link: '/community/' }
          ]
        }
      ],
      '/en/guide/': [
        {
          text: 'Basic Guide',
          items: [
            { text: 'Deployment Guide', link: '/en/guide/deployment' },
            { text: 'Usage Guide', link: '/en/guide/usage' },
            { text: 'FAQ', link: '/en/guide/faq' }
          ]
        }
      ],
      '/en/develop/': [
        {
          text: 'Development',
          items: [
            { text: 'Architecture', link: '/en/develop/architecture' },
            { text: 'Extension Guide', link: '/en/develop/extension' }
          ]
        }
      ],
      '/en/config/': [
        {
          text: 'Configuration',
          items: [
            { text: 'Config Guide', link: '/en/config/' }
          ]
        }
      ],
      '/en/community/': [
        {
          text: 'Community',
          items: [
            { text: 'Ecosystem', link: '/en/community/' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/PurrPod/cat-in-cup' }
    ],
    footer: {
      copyright: '© 2026 CatInCup. Licensed under GNU GPL-3.0.'
    }
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN'
    },
    en: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Introduction', link: '/en/intro' },
          {
            text: 'Download',
            items: [
              { text: 'Git Clone', link: 'https://github.com/PurrPod/cat-in-cup' },
              { text: 'Download ZIP', link: 'https://github.com/PurrPod/cat-in-cup/archive/refs/heads/main.zip' }
            ]
          },
          { text: 'Guide', link: '/en/guide/usage' },
          { text: 'Config', link: '/en/config/' },
          { text: 'Develop', link: '/en/develop/architecture' },
          { text: 'Community', link: '/en/community/' }
        ]
      }
    }
  }
})