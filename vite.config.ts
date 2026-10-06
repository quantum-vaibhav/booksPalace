import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { booksApi } from './server/booksApi'

export default defineConfig({
  plugins: [react(), booksApi()],
})
