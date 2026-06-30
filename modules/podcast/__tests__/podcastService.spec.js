import { describe, it, expect, vi, beforeEach } from 'vitest';
import podcastService from '../services/podcastService.js';
import Podcast from '../podcastModel.js';

// MOCK DO BANCO DE DADOS
vi.mock('../podcastModel.js', () => ({
    default: {
        create: vi.fn()
    }
}));

describe('Podcast Service - Cadastro', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Deve barrar o cadastro se faltar título ou áudio', async () => {
        const dataIncompleta = { title: 'Sem Áudio' }; 
        
        await expect(podcastService.store(dataIncompleta)).rejects.toThrow('Título e Áudio são obrigatórios.');
    });

    it('Deve criar um podcast com sucesso simulando o banco', async () => {
        Podcast.create.mockResolvedValue({ id: 1, title: 'DevCast' });
        
        const data = { title: 'DevCast', audioUrl: '12345.mp3', author: 'Admin' };
        const result = await podcastService.store(data);

        expect(Podcast.create).toHaveBeenCalled();
        expect(result.title).toBe('DevCast');
    });
});