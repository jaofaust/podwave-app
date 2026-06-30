import User from '../userModel.js';
import bcrypt from 'bcryptjs';

const userService = {
    registerUser: async (userData) => {
        const { username, email, password, confirmPassword } = userData;

        // Novas validações para garantir cobertura máxima nos testes
        if (!username || !email || !password) {
            throw new Error('Todos os campos são obrigatórios.');
        }
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem.');
        }
        if (password.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('E-mail já está cadastrado no sistema.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        return newUser;
    }
};

export default userService;