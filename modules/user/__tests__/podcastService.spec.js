import { describe, it, expect } from 'vitest';
// A importação abaixo vai quebrar o código de propósito, pois o arquivo e a função ainda não existem!
import podcastService from '../services/podcastService.js';

describe('Podcast Service - Cadastro', () => {
  it('Deve lançar erro se o título não for informado', async () => {
    // Mock de dados incompletos
    const payloadInvalido = {
      author: 'jotabasso',
      audioUrl: 'https://podwave.com/ep1.mp3'
    };

    // Asserção: Esperamos que a função de criação rejeite a execução com um erro específico
    await expect(podcastService.createPodcast(payloadInvalido)).rejects.toThrow('O título do podcast é obrigatório.');
  });
});