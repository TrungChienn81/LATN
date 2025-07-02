import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Cho phép bind tất cả interfaces
    port: 5173,
    allowedHosts: [
      'localhost', 
      'latnshop.local',
      '.ngrok.io',
      '.ngrok-free.app',
      'all'
    ], // Cho phép tất cả hosts và cụ thể latnshop.local
    hmr: {
      port: 5173,
      host: 'localhost'
    },
    // Thêm headers để support tunnel services
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With'
    }
  }
})
