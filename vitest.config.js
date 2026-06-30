import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'config/**', 
        'middlewares/**', 
        'routes/**', 
        'app.js',
        'node_modules/**',
        '**/*.spec.js' // Exclui os próprios testes da contagem
      ],
    },
  },
});