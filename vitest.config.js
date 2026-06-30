import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Permite usar describe/it direto
    environment: 'node',
    include: ['**/*.spec.js'], // <--- Diz pro Vitest rodar os arquivos .spec.js
  },
});