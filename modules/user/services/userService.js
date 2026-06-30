import User from '../userModel.js';
import bcrypt from 'bcryptjs';

const userService = {
    registerUser: async (userData) => {
        const { username, email, password, confirmPassword } = userData;

        // 1. Validação básica
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem.');
        }

        // 2. Verifica se o usuário já existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('E-mail já está cadastrado no sistema.');
        }

        // 3. O Requisito da N2: Hash de Senhas com bcryptjs
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Criação no banco
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        return newUser;
    }
};

export default userService;