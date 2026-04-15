// Vant client-side plugin for auto-import
import { showToast, showDialog, showNotify } from 'vant'

export default defineNuxtPlugin(() => {
  // Vant components are auto-imported
  return {
    provide: {
      showToast,
      showDialog,
      showNotify
    }
  }
})
