import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 환경 변수 로드 (VITE_ 접두사가 있는 변수만 클라이언트에 노출됨)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    // 환경 변수는 자동으로 import.meta.env에 주입됩니다
    // .env.local, .env.development, .env.production 파일이 자동으로 로드됩니다
  };
});

