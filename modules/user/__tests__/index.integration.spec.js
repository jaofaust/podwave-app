import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../../app.js'; 

describe('Testes de Integração HTTP - Rotas Principais', () => {
    
    it('Deve retornar status 200 na rota principal (Home)', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });

    it('Deve retornar status 200 na rota de login', async () => {
        const response = await request(app).get('/login');
        expect(response.status).toBe(200);
    });

    it('Deve retornar status 404 para uma rota inexistente', async () => {
        const response = await request(app).get('/rota-que-nao-existe-123');
        expect(response.status).toBe(404);
    });
});