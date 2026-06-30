import { describe, it, expect, vi, beforeEach } from 'vitest';
import reviewService from '../services/reviewService.js';
import Review from '../reviewModel.js';
import Podcast from '../../podcast/podcastModel.js';
import User from '../../user/userModel.js';

// Mocks rigorosos isolando o banco de dados
vi.mock('../reviewModel.js', () => ({
    default: { findOne: vi.fn(), create: vi.fn() }
}));
vi.mock('../../podcast/podcastModel.js', () => ({
    default: { findByPk: vi.fn() }
}));
vi.mock('../../user/userModel.js', () => ({
    default: { findByPk: vi.fn() }
}));

describe('Review Service - TDD Unit Tests', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // TESTE 1: Validação de campo obrigatório
    it('Deve barrar a avaliação se a nota não for enviada', async () => {
        const data = { userId: 1, podcastId: 1, comment: 'Muito bom!' };
        await expect(reviewService.addReview(data)).rejects.toThrow('A nota é obrigatória.');
    });

    // TESTE 2: Regra de negócio (Nota mínima)
    it('Deve barrar notas menores que 1', async () => {
        const data = { userId: 1, podcastId: 1, rating: 0 };
        await expect(reviewService.addReview(data)).rejects.toThrow('A nota deve ser entre 1 e 5.');
    });

    // TESTE 3: Regra de negócio (Nota máxima)
    it('Deve barrar notas maiores que 5', async () => {
        const data = { userId: 1, podcastId: 1, rating: 6 };
        await expect(reviewService.addReview(data)).rejects.toThrow('A nota deve ser entre 1 e 5.');
    });

    // TESTE 4: Integridade Referencial (Podcast não existe)
    it('Deve barrar se o podcast não existir no banco', async () => {
        Podcast.findByPk.mockResolvedValue(null);
        const data = { userId: 1, podcastId: 999, rating: 4 };
        await expect(reviewService.addReview(data)).rejects.toThrow('Podcast não encontrado.');
    });

    // TESTE 5: Integridade Referencial (Usuário não existe)
    it('Deve barrar se o usuário não existir', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue(null);
        
        const data = { userId: 999, podcastId: 1, rating: 4 };
        await expect(reviewService.addReview(data)).rejects.toThrow('Usuário inválido.');
    });

    // TESTE 6: Regra de negócio (Prevenção de duplicidade)
    it('Deve impedir que o mesmo usuário avalie o mesmo podcast duas vezes', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue({ id: 1, username: 'jotabasso' });
        
        // Simula que o banco achou uma avaliação anterior
        Review.findOne.mockResolvedValue({ id: 10, rating: 5 }); 

        const data = { userId: 1, podcastId: 1, rating: 4 };
        await expect(reviewService.addReview(data)).rejects.toThrow('Você já avaliou este podcast.');
    });

    // TESTE 7: Filtro de Palavrões (Moderação de conteúdo)
    it('Deve barrar comentários com palavras ofensivas', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue({ id: 1 });
        Review.findOne.mockResolvedValue(null);

        const data = { userId: 1, podcastId: 1, rating: 3, comment: 'Isso é um lixo' };
        await expect(reviewService.addReview(data)).rejects.toThrow('Comentário contém palavras impróprias.');
    });

    // TESTE 8: Cenário de Sucesso Absoluto
    it('Deve criar a avaliação com sucesso', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue({ id: 1, username: 'jotabasso' });
        Review.findOne.mockResolvedValue(null);
        
        // Mock da criação retornando o objeto final
        Review.create.mockResolvedValue({ id: 1, rating: 5, comment: 'Excelente episódio!' });

        const data = { userId: 1, podcastId: 1, rating: 5, comment: 'Excelente episódio!' };
        const result = await reviewService.addReview(data);

        expect(Review.create).toHaveBeenCalledTimes(1);
        expect(result).toHaveProperty('id');
        expect(result.rating).toBe(5);
    });

    // TESTE 9: Tratamento de Erro do Banco de Dados
    it('Deve repassar o erro se o banco de dados falhar ao salvar', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue({ id: 1 });
        Review.findOne.mockResolvedValue(null);
        
        Review.create.mockRejectedValue(new Error('Falha de conexão com MariaDB'));

        const data = { userId: 1, podcastId: 1, rating: 4 };
        await expect(reviewService.addReview(data)).rejects.toThrow('Falha de conexão com MariaDB');
    });

    // TESTE 10: Avaliação sem comentário (Apenas nota)
    it('Deve criar avaliação com sucesso mesmo sem comentário', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue({ id: 1 });
        Review.findOne.mockResolvedValue(null);
        
        Review.create.mockResolvedValue({ id: 2, rating: 4, comment: null });

        const data = { userId: 1, podcastId: 1, rating: 4 };
        const result = await reviewService.addReview(data);

        expect(Review.create).toHaveBeenCalled();
        expect(result.comment).toBeNull();
    });
});