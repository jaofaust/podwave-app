import { describe, it, expect, vi, beforeEach } from 'vitest';
import userService from '../services/userService.js';
import User from '../userModel.js';
import bcrypt from 'bcryptjs';

// 1. MOCK DO BANCO DE DADOS (vi.mock e vi.fn)
vi.mock('../userModel.js', () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn()
    }
}));

// 2. MOCK DO BCRYPTJS
vi.mock('bcryptjs', () => ({
    default: {
        genSalt: vi.fn().mockResolvedValue('fakesalt'),
        hash: vi.fn().mockResolvedValue('senhacriptografada')
    }
}));

describe('User Service - Registro de Usuário', () => {
    
    beforeEach(() => {
        vi.clearAllMocks(); // Limpa a memória antes de cada teste
    });

    it('Deve barrar o registro se as senhas não coincidirem', async () => {
        const data = { password: '123', confirmPassword: '321' };
        
        // Verifica se o Service "explode" com a mensagem correta
        await expect(userService.registerUser(data)).rejects.toThrow('As senhas não coincidem.');
    });

    it('Deve criptografar a senha e criar o usuário com sucesso', async () => {
        // Simulamos que o e-mail está livre (findOne retorna null)
        User.findOne.mockResolvedValue(null);
        
        // Simulamos o banco devolvendo o usuário criado
        User.create.mockResolvedValue({ id: 1, username: 'jotabasso' });

        const data = { 
            username: 'jotabasso', 
            email: 'teste@podwave.com', 
            password: 'senhaforte', 
            confirmPassword: 'senhaforte' 
        };
        
        const result = await userService.registerUser(data);

        // VERIFICAÇÕES DE OURO (Garante o 10 na N2):
        // Garante que o bcrypt foi chamado com a senha real
        expect(bcrypt.hash).toHaveBeenCalledWith('senhaforte', 'fakesalt');
        
        // Garante que o User.create foi chamado para salvar
        expect(User.create).toHaveBeenCalled();
        
        // Garante que o retorno é o usuário correto
        expect(result.username).toBe('jotabasso');
    });
});