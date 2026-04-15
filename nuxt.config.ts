// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // SSR enabled
  ssr: true,

  // App configuration
  app: {
    head: {
      title: '英语学习平台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: '在线英语学习平台' },
        { name: 'theme-color', content: '#1989fa' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Global CSS
  css: [
    'vant/lib/index.css'
  ],

    // Modules
    modules: ['@pinia/nuxt'],

    // Enable pages (required for file-based routing)
    pages: true,

  // Vant auto-import
  imports: {
    presets: [
      {
        from: 'vant',
        imports: [
          'Button',
          'Cell',
          'CellGroup',
          'Field',
          'Form',
          'NavBar',
          'Icon',
          'Dialog',
          'Toast',
          'List',
          'PullRefresh',
          'Popup',
          'Picker',
          'Calendar',
          'Progress',
          'Card',
          'Tag',
          'Empty',
          'FloatingButton',
          'Empty'
        ]
      }
    ]
  },

  // Auto-import components
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  // Runtime config
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    public: {
      apiBase: process.env.API_BASE || '/api',
      baiduTtsAppId: process.env.BAIDU_TTS_APP_ID || '',
      baiduTtsApiKey: process.env.BAIDU_TTS_API_KEY || ''
    }
  },

  // Nitro server configuration
  nitro: {
    preset: 'node-server'
  }
})
