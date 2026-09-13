<template>
  <div class="anthropic-eco-wrapper">
    <div class="eco-container">
      <div class="eco-header">
        <div class="header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        </div>
        <h1 class="serif-title">PurrCat resources</h1>
        <p class="serif-subtitle">{{ subtitle }}</p>
      </div>
      <div class="eco-grid">
        <a v-for="card in ecoCards" :key="card.link" :href="card.link" target="_blank" class="elegant-card">
          <div class="card-content">
            <h2 class="serif-heading">{{ card.heading }}</h2>
            <p class="card-desc">{{ card.desc }}</p>
          </div>
          <div class="card-footer">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span>{{ card.footer }}</span>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { localeIndex } = useData()

const cards = [
  {
    heading: 'Agent Skills',
    link: 'https://github.com/PurrPod/skills',
    footer: 'github.com/PurrPod/skills'
  },
  {
    heading: 'MCP Servers',
    link: 'https://github.com/PurrPod/mcps',
    footer: 'github.com/PurrPod/mcps'
  },
  {
    heading: 'Graphs',
    link: 'https://github.com/PurrPod/graphs',
    footer: 'github.com/PurrPod/graphs'
  },
  {
    heading: 'Sensors',
    link: 'https://github.com/PurrPod/sensors',
    footer: 'github.com/PurrPod/sensors'
  }
]

const texts = {
  root: {
    subtitle: 'PurrCat的生态集市',
    descs: [
      '发现和分享即插即用的高质量智能体技能与 SOP 编排。',
      '获取标准化的模型上下文协议服务端，极速拓宽能力边界。',
      '下载 DAG 可视化图谱配置，一键部署复杂的多节点并发任务。',
      '为大模型装上"眼睛和耳朵"，配置即装载的主动感知环境。'
    ]
  },
  en: {
    subtitle: 'The PurrCat Ecosystem Marketplace',
    descs: [
      'Discover and share plug-and-play, high-quality agent skills and SOP orchestration.',
      'Grab standardized Model Context Protocol servers to rapidly widen your capability boundary.',
      'Download DAG visual graph configurations and deploy complex multi-node concurrent workflows with one click.',
      'Give your LLM "eyes and ears" — ready-to-mount, configuration-driven active perception.'
    ]
  }
}

const subtitle = computed(() => texts[localeIndex.value].subtitle)

const ecoCards = computed(() => {
  const locale = texts[localeIndex.value]
  return cards.map((card, i) => ({ ...card, desc: locale.descs[i] }))
})
</script>
