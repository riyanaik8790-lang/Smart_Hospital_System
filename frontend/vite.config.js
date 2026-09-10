import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/patients': 'http://127.0.0.1:5000',
      '/dashboard': 'http://127.0.0.1:5000',
      '/add-patient': 'http://127.0.0.1:5000',
      '/emergency-admit': 'http://127.0.0.1:5000',
      '/discharge': 'http://127.0.0.1:5000',
      '/doctors': 'http://127.0.0.1:5000',
      '/rooms': 'http://127.0.0.1:5000',
      '/aoa-performance': 'http://127.0.0.1:5000',
    },
  },
})
