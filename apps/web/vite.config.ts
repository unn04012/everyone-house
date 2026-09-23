import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 정적 사이트(Render Static Site)로 빌드한다. API 주소는 VITE_API_BASE_URL 로만 주입한다.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: { outDir: 'dist', sourcemap: true },
});
