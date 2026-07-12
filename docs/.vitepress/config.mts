import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "PurrCat",
  description: "PurrCat 官方文档",
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '介绍', link: '/intro' },
      {
        text: '下载',
        items: [
          { text: 'Git Clone', link: 'https://github.com/PurrPod/purrcat' },
          { text: '下载压缩包', link: 'https://github.com/PurrPod/purrcat/archive/refs/heads/main.zip' }
        ]
      },
      { text: '指南', link: '/guide/deployment' },
      { text: '生态', link: '/community/' }
    ],
    sidebar: {
      '/guide/': [
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
            { text: 'Configuration Guide', link: '/en/guide/configuration' },
            { text: 'Usage Guide', link: '/en/guide/usage' },
            { text: 'Development Guide', link: '/en/guide/development' },
            { text: 'FAQ', link: '/en/guide/faq' }
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
      { icon: 'github', link: 'https://github.com/PurrPod/purrcat' }
    ],
    footer: {
      copyright: '© 2026 PurrCat. Licensed under MIT.'
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
              { text: 'Git Clone', link: 'https://github.com/PurrPod/purrcat' },
              { text: 'Download ZIP', link: 'https://github.com/PurrPod/purrcat/archive/refs/heads/main.zip' }
            ]
          },
          { text: 'Guide', link: '/en/guide/usage' },
          { text: 'Community', link: '/en/community/' }
        ]
      }
    }
  }
})