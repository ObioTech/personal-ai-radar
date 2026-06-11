import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "ObioRadar",
  description: "Personal AI Technology Radar",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Daily Digest', link: '/daily/' },
      { text: 'Deep Dives', link: '/reports/' }
    ],
    sidebar: [
      {
        text: 'ObioRadar',
        items: [
          { text: 'Home', link: '/' },
          { text: 'Daily Digest', link: '/daily/' },
          { text: 'Deep Dives', link: '/reports/' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ]
  },
  ignoreDeadLinks: true
})
