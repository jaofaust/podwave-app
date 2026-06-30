import request from 'supertest';
import app from '../../../app.js'; // Preste atenção no caminho para voltar até a raiz onde está o app.js

describe('Integração - Rotas Principais', () => {
    
    it('Deve carregar a página inicial com sucesso (Status 200)', async () => {
        const response = await request(app).get('/');
        
        expect(response.status).toBe(200);
        expect(response.text).toContain('PodWave');
    });

    it('Deve redirecionar acesso negado ao Dashboard', async () => {
        // Tenta acessar uma rota protegida sem estar logado
        const response = await request(app).get('/admin/dashboard');
        
        // Deve redirecionar para a tela de login (status 302)
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/login');
    });
});