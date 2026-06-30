import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express'; // Importamos o Express direto aqui

// 1. MOCK ABSOLUTO DO BANCO DE DADOS (Tem que vir antes de tudo)
vi.mock('../reviewModel.js', () => ({ default: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock('../../podcast/podcastModel.js', () => ({ default: { findByPk: vi.fn() } }));
vi.mock('../../user/userModel.js', () => ({ default: { findByPk: vi.fn() } }));

import reviewController from '../reviewController.js';
import Review from '../reviewModel.js';
import Podcast from '../../podcast/podcastModel.js';
import User from '../../user/userModel.js';

// 2. CRIANDO O MINI-APP EXPRESS BLINDADO
const app = express();
app.use(express.json()); // Permite ler o req.body

let fakeSession = true;

// Middleware falso injetado direto no mini-app
const mockAuth = (req, res, next) => {
    if (!fakeSession) return res.redirect('/login');
    // Injetamos a sessão com a sua credencial padrão
    req.session = { user: { id: 1, username: 'jotabasso', role: 'admin' } };
    next();
};

// Conectamos a rota diretamente no nosso mini-app!
app.post('/api/reviews', mockAuth, reviewController.addReview);

// =========================================================================

describe('Review - HTTP Integration Tests (Mini-App)', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
        fakeSession = true; 
    });

    it('1. Deve redirecionar para /login se o utilizador não possuir sessão ativa', async () => {
        fakeSession = false;
        const response = await request(app).post('/api/reviews').send({ podcastId: 1, rating: 5 });
        expect(response.status).toBe(302);
    });

    it('2. Deve retornar status 201 ao criar avaliação com sucesso', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue({ id: 1 });
        Review.findOne.mockResolvedValue(null); 
        Review.create.mockResolvedValue({ id: 100, rating: 5, comment: 'Incrível!' });

        const response = await request(app).post('/api/reviews').send({ podcastId: 1, rating: 5, comment: 'Incrível!' });
        
        expect(response.status).toBe(201);
        expect(response.body.data.id).toBe(100);
    });

    it('3. Deve retornar status 400 por falta de nota', async () => {
        const response = await request(app).post('/api/reviews').send({ podcastId: 1 });
        expect(response.status).toBe(400);
    });

    it('4. Deve retornar status 400 se a nota for menor que 1', async () => {
        const response = await request(app).post('/api/reviews').send({ podcastId: 1, rating: 0 });
        expect(response.status).toBe(400);
    });

    it('5. Deve retornar status 400 se a nota for maior que 5', async () => {
        const response = await request(app).post('/api/reviews').send({ podcastId: 1, rating: 6 });
        expect(response.status).toBe(400);
    });

    it('6. Deve retornar status 404 se o podcast não existir', async () => {
        Podcast.findByPk.mockResolvedValue(null); 
        const response = await request(app).post('/api/reviews').send({ podcastId: 999, rating: 4 });
        expect(response.status).toBe(404);
    });

    it('7. Deve retornar status 409 para avaliação duplicada', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue({ id: 1 });
        Review.findOne.mockResolvedValue({ id: 99 }); 

        const response = await request(app).post('/api/reviews').send({ podcastId: 1, rating: 3 });
        expect(response.status).toBe(409);
    });

    it('8. Deve retornar status 400 para palavras impróprias', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue({ id: 1 });
        Review.findOne.mockResolvedValue(null);

        const response = await request(app).post('/api/reviews').send({ podcastId: 1, rating: 2, comment: 'Esse conteúdo é um lixo' });
        expect(response.status).toBe(400);
    });

    it('9. Deve retornar status 500 em caso de erro no banco de dados', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue({ id: 1 });
        Review.findOne.mockResolvedValue(null);
        Review.create.mockRejectedValue(new Error('Crash no MariaDB')); 

        const response = await request(app).post('/api/reviews').send({ podcastId: 1, rating: 5 });
        expect(response.status).toBe(500);
    });

    it('10. Deve criar a avaliação sem comentário', async () => {
        Podcast.findByPk.mockResolvedValue({ id: 1 });
        User.findByPk.mockResolvedValue({ id: 1 });
        Review.findOne.mockResolvedValue(null);
        Review.create.mockResolvedValue({ id: 101, rating: 4, comment: null });

        const response = await request(app).post('/api/reviews').send({ podcastId: 1, rating: 4 });
        expect(response.status).toBe(201);
        expect(response.body.data.comment).toBeNull();
    });
});