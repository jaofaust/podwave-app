import bcrypt from 'bcryptjs';
import User from '../userModel.js';

const userService = {
    async registerUser({ username, email, password, confirmPassword, fullName }) {
        // Regra 1: Campos obrigatórios
        if (!username || !email || !password || !confirmPassword) {
            throw new Error('Todos os campos obrigatórios devem ser preenchidos.');
        }

        // Regra 2: Tamanho mínimo da senha
        if (password.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }

        // Regra 3: Senhas coincidentes
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem.');
        }

        // Regra 4: Validação de formato de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Formato de e-mail inválido.');
        }

        // Regra 5: E-mail já existe
        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) {
            throw new Error('Este e-mail já está cadastrado.');
        }

        // Regra 6: Username já existe
        const usernameExists = await User.findOne({ where: { username } });
        if (usernameExists) {
            throw new Error('Este usuário já está cadastrado.');
        }

        // Sucesso: Hash e Criação
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            fullName
        });

        return newUser;
    }
};

export default userService;