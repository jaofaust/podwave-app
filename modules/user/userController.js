import User from './userModel.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import userService from './services/userService.js'; // <--- Importação do Service!

const userController = {
    register: async (req, res) => {
        try {
            // A mágica do TDD: O Controller agora só repassa os dados para o Service
            await userService.registerUser(req.body);

            // Se o Service não lançar nenhum erro, deu tudo certo!
            req.flash('success', 'Conta criada com sucesso! Faça seu login.');
            res.redirect('/login');

        } catch (error) {
            // Se o Service barrar algo (ex: senhas diferentes), o erro cai aqui
            console.error(error);
            req.flash('error', error.message); 
            res.redirect('/register');
        }
    },

    login: async (req, res) => {
       try {
          const { login, password } = req.body; // login pode ser email ou username

          // 1. Buscar usuário por email OU username
          const user = await User.findOne({
             where: {
                [Op.or]: [{ email: login }, { username: login }]
             }
          });

          // 2. Verificar se usuário existe e se a senha bate
          if (!user || !(await bcrypt.compare(password, user.password))) {
             req.flash('error', 'E-mail/Usuário ou senha incorretos.');
             return res.redirect('/login');
          }

          // 3. Criar a sessão do usuário
          req.session.user = {
             id: user.id,
             username: user.username,
             email: user.email,
             role: user.role
          };

          // 4. Redirecionar para o feed
          res.redirect('/feed');

       } catch (error) {
          console.error(error);
          req.flash('error', 'Ocorreu um erro ao tentar entrar.');
          res.redirect('/login');
       }
    },

    logout: (req, res) => {
       req.session.destroy(() => {
          res.redirect('/');
       });
    },

    getProfile: async (userId) => {
        try {
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'email', 'fullName', 'bio', 'profilePicture']
            });
            return user;
        } catch (error) {
            console.error(error);
            throw new Error('Erro ao buscar perfil do usuário.');
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { fullName, bio } = req.body;
            const userId = req.session.user.id;

            const updateData = { fullName, bio };

            // Se um arquivo foi enviado pelo Multer, ele estará em req.file
            if (req.file) {
                updateData.profilePicture = req.file.filename;
            }

            await User.update(updateData, { where: { id: userId } });

            req.flash('success', 'Perfil atualizado com sucesso!');
            res.redirect('/profile/edit');

        } catch (error) {
            console.error(error);
            req.flash('error', 'Erro ao atualizar perfil.');
            res.redirect('/profile/edit');
        }
    }
};

export default userController;