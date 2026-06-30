import { describe, it, expect, vi, beforeEach } from 'vitest';
import userController from '../userController.js';
import userService from '../services/userService.js';
import User from '../userModel.js';
import bcrypt from 'bcryptjs';

// Mocks do Service e do Banco de Dados
vi.mock('../services/userService.js', () => ({
    default: { registerUser: vi.fn() }
}));
vi.mock('../userModel.js', () => ({
    default: { findOne: vi.fn(), findByPk: vi.fn(), update: vi.fn() }
}));
vi.mock('bcryptjs', () => ({
    default: { compare: vi.fn() }
}));

describe('User Controller - Coverage Tests', () => {
    let req, res;

    // Limpa e recria os objetos falsos do Express (req, res) antes de cada teste
    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            body: {},
            session: {
                user: { id: 1 },
                destroy: vi.fn((cb) => cb()) // Simula o callback do destroy no logout
            },
            flash: vi.fn(),
            file: undefined
        };
        res = {
            redirect: vi.fn(),
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    it('1. Deve registrar usuário com sucesso e redirecionar para o login', async () => {
        req.body = { username: 'test', password: '123' };
        await userController.register(req, res);
        
        expect(userService.registerUser).toHaveBeenCalledWith(req.body);
        expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('2. Deve redirecionar para register em caso de erro na camada de serviço', async () => {
        userService.registerUser.mockRejectedValue(new Error('Senhas diferentes'));
        await userController.register(req, res);
        
        expect(req.flash).toHaveBeenCalledWith('error', 'Senhas diferentes');
        expect(res.redirect).toHaveBeenCalledWith('/register');
    });

    it('3. Deve fazer login e criar sessão na requisição', async () => {
        req.body = { login: 'admin', password: '123' };
        // Simula que achou o usuário no banco e que a senha bateu
        User.findOne.mockResolvedValue({ id: 1, username: 'admin', password: 'hash', role: 'admin' });
        bcrypt.compare.mockResolvedValue(true); 

        await userController.login(req, res);
        
        expect(req.session.user.username).toBe('admin');
        expect(res.redirect).toHaveBeenCalledWith('/feed');
    });

    it('4. Deve barrar login se a senha estiver errada', async () => {
        User.findOne.mockResolvedValue({ id: 1, password: 'hash' }); 
        bcrypt.compare.mockResolvedValue(false); // Senha errada

        await userController.login(req, res);
        
        expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('5. Deve realizar o logout limpando a sessão', () => {
        userController.logout(req, res);
        expect(req.session.destroy).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/');
    });

    it('6. Deve atualizar o perfil do usuário (com foto do Multer)', async () => {
        req.body = { fullName: 'Jota', bio: 'Dev' };
        req.file = { filename: 'foto.png' }; // Simulando o upload do Multer
        
        await userController.updateProfile(req, res);
        
        expect(User.update).toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
        expect(res.redirect).toHaveBeenCalledWith('/profile/edit');
    });

    it('7. Deve tratar erro disparado pelo banco de dados ao atualizar perfil', async () => {
        User.update.mockRejectedValue(new Error('DB Offline'));
        
        await userController.updateProfile(req, res);
        
        expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        expect(res.redirect).toHaveBeenCalledWith('/profile/edit');
    });

    it('8. Deve simular um erro no catch do login', async () => {
        // Força um erro bizarro no banco para cair no "catch" do Controller
        User.findOne.mockRejectedValue(new Error('Banco de Dados Offline'));
        await userController.login(req, res);
        
        expect(req.flash).toHaveBeenCalledWith('error', 'Ocorreu um erro ao tentar entrar.');
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('9. Deve buscar o perfil do usuário com sucesso (getProfile)', async () => {
        User.findByPk.mockResolvedValue({ id: 1, username: 'jotabasso' });
        
        const result = await userController.getProfile(1);
        
        expect(User.findByPk).toHaveBeenCalled();
        expect(result.username).toBe('jotabasso');
    });

    it('10. Deve lançar erro ao falhar a busca de perfil (getProfile)', async () => {
        User.findByPk.mockRejectedValue(new Error('Erro interno do DB'));
        
        await expect(userController.getProfile(1)).rejects.toThrow('Erro ao buscar perfil do usuário.');
    });
});

