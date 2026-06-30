import { describe, it, expect, vi, beforeEach } from 'vitest';
import userService from '../services/userService.js';
import User from '../userModel.js';
import bcrypt from 'bcryptjs';

vi.mock('../userModel.js', () => ({
    default: { findOne: vi.fn(), create: vi.fn() }
}));

vi.mock('bcryptjs', () => ({
    default: {
        genSalt: vi.fn().mockResolvedValue('fakesalt'),
        hash: vi.fn().mockResolvedValue('senhacriptografada')
    }
}));

describe('User Service - 10 Testes Unitários (TDD)', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. Deve barrar se faltar algum campo obrigatório', async () => {
        const data = { username: 'joao', email: '' };
        await expect(userService.registerUser(data)).rejects.toThrow('Todos os campos são obrigatórios.');
    });

    it('2. Deve barrar o registro se as senhas não coincidirem', async () => {
        const data = { username: 'joao', email: 'joao@email.com', password: '123', confirmPassword: '321' };
        await expect(userService.registerUser(data)).rejects.toThrow('As senhas não coincidem.');
    });

    it('3. Deve barrar se a senha tiver menos de 6 caracteres', async () => {
        const data = { username: 'joao', email: 'joao@email.com', password: '12345', confirmPassword: '12345' };
        await expect(userService.registerUser(data)).rejects.toThrow('A senha deve ter pelo menos 6 caracteres.');
    });

    it('4. Deve barrar se o e-mail já estiver cadastrado', async () => {
        User.findOne.mockResolvedValueOnce({ id: 1, email: 'joao@email.com' }); 
        const data = { username: 'joao', email: 'joao@email.com', password: 'senhaforte', confirmPassword: 'senhaforte' };
        await expect(userService.registerUser(data)).rejects.toThrow('E-mail já está cadastrado no sistema.');
    });

    it('5. Deve repassar erro se o banco falhar ao procurar o e-mail', async () => {
        // Usamos o 'Once' para o erro não vazar para os próximos testes!
        User.findOne.mockRejectedValueOnce(new Error('Erro no DB'));
        const data = { username: 'joao', email: 'joao@email.com', password: 'senhaforte', confirmPassword: 'senhaforte' };
        await expect(userService.registerUser(data)).rejects.toThrow('Erro no DB');
    });

    it('6. Deve repassar erro se a criação no banco falhar', async () => {
        User.findOne.mockResolvedValueOnce(null);
        // Usamos o 'Once' aqui também
        User.create.mockRejectedValueOnce(new Error('Falha ao criar'));
        const data = { username: 'joao', email: 'joao@email.com', password: 'senhaforte', confirmPassword: 'senhaforte' };
        await expect(userService.registerUser(data)).rejects.toThrow('Falha ao criar');
    });

    it('7. Deve repassar erro se o bcrypt falhar ao gerar o hash', async () => {
        User.findOne.mockResolvedValueOnce(null);
        // E o 'Once' salva o dia aqui!
        bcrypt.hash.mockRejectedValueOnce(new Error('Erro de Criptografia'));
        const data = { username: 'joao', email: 'joao@email.com', password: 'senhaforte', confirmPassword: 'senhaforte' };
        await expect(userService.registerUser(data)).rejects.toThrow('Erro de Criptografia');
    });

    it('8. Deve criptografar a senha corretamente usando bcrypt', async () => {
        User.findOne.mockResolvedValueOnce(null);
        User.create.mockResolvedValueOnce({ id: 1 });
        const data = { username: 'joao', email: 'joao@email.com', password: 'senhaforte', confirmPassword: 'senhaforte' };
        
        await userService.registerUser(data);
        expect(bcrypt.hash).toHaveBeenCalledWith('senhaforte', 'fakesalt');
    });

    it('9. Deve acionar o User.create com a senha já criptografada', async () => {
        User.findOne.mockResolvedValueOnce(null);
        User.create.mockResolvedValueOnce({ id: 1 });
        const data = { username: 'joao', email: 'joao@email.com', password: 'senhaforte', confirmPassword: 'senhaforte' };
        
        await userService.registerUser(data);
        expect(User.create).toHaveBeenCalledWith({
            username: 'joao',
            email: 'joao@email.com',
            password: 'senhacriptografada'
        });
    });

    it('10. Deve retornar o objeto do usuário criado com sucesso', async () => {
        User.findOne.mockResolvedValueOnce(null);
        User.create.mockResolvedValueOnce({ id: 1, username: 'joao' });
        const data = { username: 'joao', email: 'joao@email.com', password: 'senhaforte', confirmPassword: 'senhaforte' };
        
        const result = await userService.registerUser(data);
        expect(result.username).toBe('joao');
        expect(result).toHaveProperty('id');
    });
});