import { describe, it, expect, vi, beforeEach } from 'vitest';
import userService from '../services/userService.js';
import User from '../userModel.js';
import bcrypt from 'bcryptjs';

// Mock das dependências externas
vi.mock('../userModel.js');
vi.mock('bcryptjs');

describe('UserService - Funcionalidade de Registro', () => {
    
    beforeEach(() => {
        vi.clearAllMocks(); // Limpa o estado dos mocks antes de cada teste
    });

    const validPayload = {
        username: 'jotabasso',
        email: 'joaopaulo@teste.com',
        password: 'senhaSegura123',
        confirmPassword: 'senhaSegura123',
        fullName: 'João Paulo Faust'
    };

    it('1. Deve lançar erro se campos obrigatórios estiverem faltando', async () => {
        const payload = { ...validPayload, username: '' };
        await expect(userService.registerUser(payload)).rejects.toThrow('Todos os campos obrigatórios devem ser preenchidos.');
    });

    it('2. Deve lançar erro se a senha tiver menos de 6 caracteres', async () => {
        const payload = { ...validPayload, password: '123', confirmPassword: '123' };
        await expect(userService.registerUser(payload)).rejects.toThrow('A senha deve ter pelo menos 6 caracteres.');
    });

    it('3. Deve lançar erro se as senhas não coincidirem', async () => {
        const payload = { ...validPayload, confirmPassword: 'senhaDiferente' };
        await expect(userService.registerUser(payload)).rejects.toThrow('As senhas não coincidem.');
    });

    it('4. Deve lançar erro se o formato do e-mail for inválido', async () => {
        const payload = { ...validPayload, email: 'email-sem-arroba.com' };
        await expect(userService.registerUser(payload)).rejects.toThrow('Formato de e-mail inválido.');
    });

    it('5. Deve lançar erro se o e-mail já estiver cadastrado no banco', async () => {
        User.findOne.mockResolvedValueOnce({ id: 1, email: validPayload.email }); // Simula que achou o email
        await expect(userService.registerUser(validPayload)).rejects.toThrow('Este e-mail já está cadastrado.');
    });

    it('6. Deve lançar erro se o username já estiver cadastrado no banco', async () => {
        User.findOne.mockResolvedValueOnce(null); // Passa no teste do email
        User.findOne.mockResolvedValueOnce({ id: 1, username: validPayload.username }); // Simula que achou o username
        await expect(userService.registerUser(validPayload)).rejects.toThrow('Este usuário já está cadastrado.');
    });

    it('7. Deve chamar o bcrypt para criptografar a senha em caso de sucesso', async () => {
        User.findOne.mockResolvedValue(null);
        bcrypt.genSalt.mockResolvedValue('salt123');
        bcrypt.hash.mockResolvedValue('senhaCriptografada');
        User.create.mockResolvedValue({ id: 1, ...validPayload });

        await userService.registerUser(validPayload);

        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(bcrypt.hash).toHaveBeenCalledWith(validPayload.password, 'salt123');
    });

    it('8. Deve chamar o User.create com a senha criptografada e não a senha em texto plano', async () => {
        User.findOne.mockResolvedValue(null);
        bcrypt.genSalt.mockResolvedValue('salt');
        bcrypt.hash.mockResolvedValue('hashFinal');
        
        await userService.registerUser(validPayload);

        expect(User.create).toHaveBeenCalledWith({
            username: validPayload.username,
            email: validPayload.email,
            password: 'hashFinal', // Garante que a senha salva é o hash
            fullName: validPayload.fullName
        });
    });

    it('9. Deve retornar o objeto do usuário recém-criado em caso de sucesso', async () => {
        User.findOne.mockResolvedValue(null);
        bcrypt.genSalt.mockResolvedValue('salt');
        bcrypt.hash.mockResolvedValue('hash');
        User.create.mockResolvedValue({ id: 99, username: validPayload.username });

        const result = await userService.registerUser(validPayload);
        
        // Uso da asserção exigida na rubrica
        expect(result).toHaveProperty('id', 99);
        expect(result).toHaveProperty('username', 'jotabasso');
    });

    it('10. Não deve chamar o User.create se a validação de email falhar (Testando isolamento)', async () => {
        User.findOne.mockResolvedValueOnce({ id: 1, email: validPayload.email }); // Falha no email
        
        try {
            await userService.registerUser(validPayload);
        } catch (e) {
            // Ignora o erro capturado, queremos apenas checar se a execução parou
        }

        expect(User.create).not.toHaveBeenCalled();
    });

    // 11. Teste de limite de tamanho da senha (exatamente 6 caracteres)
    it('11. Deve passar na validação de tamanho se a senha tiver exatamente 6 caracteres', async () => {
        const payload = { ...validPayload, password: '123456', confirmPassword: '123456' };
        
        User.findOne.mockResolvedValue(null);
        bcrypt.genSalt.mockResolvedValue('salt');
        bcrypt.hash.mockResolvedValue('hash');
        User.create.mockResolvedValue({ id: 2, username: payload.username });

        const result = await userService.registerUser(payload);
        expect(result).toHaveProperty('id', 2);
    });

    // 12. Falha de obrigatoriedade focada em um campo específico
    it('12. Deve lançar erro se apenas o e-mail não for preenchido', async () => {
        const payload = { ...validPayload, email: '' };
        await expect(userService.registerUser(payload)).rejects.toThrow('Todos os campos obrigatórios devem ser preenchidos.');
    });

    // 13. Falha de formatação de e-mail avançada
    it('13. Deve lançar erro se o e-mail não tiver um domínio válido (ex: sem o .com)', async () => {
        const payload = { ...validPayload, email: 'jotabasso@teste' };
        await expect(userService.registerUser(payload)).rejects.toThrow('Formato de e-mail inválido.');
    });

    // 14. Tratamento de erro inesperado na criação do usuário (Simulando queda do banco)
    it('14. Deve repassar o erro se User.create falhar inesperadamente', async () => {
        User.findOne.mockResolvedValue(null);
        bcrypt.genSalt.mockResolvedValue('salt');
        bcrypt.hash.mockResolvedValue('hash');
        // Simulamos o Sequelize dando erro na hora de salvar
        User.create.mockRejectedValue(new Error('Erro interno de conexão no banco')); 

        await expect(userService.registerUser(validPayload)).rejects.toThrow('Erro interno de conexão no banco');
    });

    // 15. Tratamento de erro na geração de hash
    it('15. Deve repassar o erro se o bcrypt falhar ao gerar o hash', async () => {
        User.findOne.mockResolvedValue(null);
        bcrypt.genSalt.mockResolvedValue('salt');
        // Simulamos o bcrypt estourando um erro
        bcrypt.hash.mockRejectedValue(new Error('Falha ao processar criptografia'));

        await expect(userService.registerUser(validPayload)).rejects.toThrow('Falha ao processar criptografia');
    });
});