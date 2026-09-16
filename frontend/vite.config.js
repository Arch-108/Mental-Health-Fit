import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // host: true binds to 0.0.0.0 (not just localhost) so devices on the same
  // LAN - e.g. a friend's laptop for testing a video call - can reach it at
  // this machine's local IP, not just from this machine itself.
  server: { port: 5173, host: true },
});
