import express from 'express';
const router = express.Router();

import userController from '../modules/user/userController.js'; 
// Depois (importação nomeada correta)
import { authMiddleware } from '../middlewares/auth.js';
import adminMiddleware from '../middlewares/admin.js'; // NOVO MIDDLEWARE
import upload from '../middlewares/multer.js';
import Favorite from '../modules/user/favoriteModel.js'; 
import Progress from '../modules/user/progressModel.js';
import Podcast from '../modules/podcast/podcastModel.js'; 
import User from '../modules/user/userModel.js';

// ==========================================

router.get('/', function (req, res, next) {
   res.render('index', { title: 'Vídeos Curtos e Engajadores' });
});

router.get('/register', (req, res) => {
   res.render('register', { title: 'Criar Conta' });
});

router.post('/register', userController.register);

router.get('/login', (req, res) => {
   res.render('login', { title: 'Entrar' });
});

router.post('/login', userController.login);

router.get('/logout', userController.logout);

router.get('/feed', authMiddleware, async (req, res) => {
    try {
        const user = await userController.getProfile(req.session.user.id);
        
        // Busca os favoritos
        const userFavorites = await Favorite.findAll({
            where: { userId: req.session.user.id }
        });
        const favoriteIds = userFavorites.map(fav => fav.podcastId.toString());

        // Busca os podcasts reais no banco de dados
        const podcasts = await Podcast.findAll({
            order: [['createdAt', 'DESC']]
        });

        // ENVIA A VARIÁVEL PARA O EJS AQUI 👇
        res.render('home', { 
            user: user, 
            favoriteIds: favoriteIds, 
            podcasts: podcasts 
        });

    } catch (error) {
        console.error('ERRO AO CARREGAR O FEED:', error);
        res.status(500).send("Erro interno ao carregar o feed de conteúdos.");
    }
});
router.get('/profile/edit', authMiddleware, async (req, res) => {
    const user = await userController.getProfile(req.session.user.id);
    res.render('edit-profile', { user });
});

router.get('/continue', authMiddleware, async (req, res) => {
    const user = await userController.getProfile(req.session.user.id);
    res.render('continue', { title: 'Continuar Ouvindo', user: user });
});

/// ==========================================
// ROTA DO ADMIN - PROTEGIDA E COM ESTATÍSTICAS
// ==========================================
router.get('/admin/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = req.session.user;
        
        // 1. Buscando as estatísticas (Contagem direta no banco)
        const totalUsers = await User.count();
        const totalPodcasts = await Podcast.count();
        const totalFavorites = await Favorite.count();
        
        // 2. Busca os podcasts para listar em uma tabela
        const podcasts = await Podcast.findAll({
            order: [['createdAt', 'DESC']], // Mais recentes primeiro
            limit: 5 // Traz apenas os 5 últimos adicionados para o dashboard não ficar gigante
        });

        // 3. Monta o objeto de estatísticas
        const stats = {
            users: totalUsers,
            podcasts: totalPodcasts,
            favorites: totalFavorites
        };

        // 4. Renderiza a tela enviando tudo
        res.render('admin/dashboard', { 
            title: 'Painel de Controle', 
            user: user,
            podcasts: podcasts,
            stats: stats // <--- Enviando os números pro frontend
        });
    } catch (error) {
        console.error('Erro ao carregar o dashboard do admin:', error);
        res.status(500).send("Erro interno ao carregar o painel.");
    }
});

// ==========================================
// ROTA DA TELA DE FAVORITOS
// ==========================================
router.get('/favorites', authMiddleware, async (req, res) => {
    try {
        const user = await userController.getProfile(req.session.user.id);
        
        const userFavorites = await Favorite.findAll({
            where: { userId: req.session.user.id }
        });

        
        
        const favoriteIds = userFavorites.map(fav => fav.podcastId);

        let favoritePodcasts = [];
        if (favoriteIds.length > 0) {
            favoritePodcasts = await Podcast.findAll({
                where: {
                    id: favoriteIds
                }
            });
        }

        res.render('favorites', { 
            title: 'Favoritos', 
            user: user,
            podcasts: favoritePodcasts, 
            favoriteIds: favoriteIds 
        });
    } catch (error) {
        console.error('ERRO AO CARREGAR TELA DE FAVORITOS:', error);
        res.status(500).send("Erro interno ao carregar a página de favoritos.");
    }
});

router.get('/history', authMiddleware, async (req, res) => {
    const user = await userController.getProfile(req.session.user.id);
    res.render('history', { title: 'Histórico', user: user });
});

router.get('/categories', authMiddleware, async (req, res) => {
    const user = await userController.getProfile(req.session.user.id);
    res.render('categories', { title: 'Categorias', user: user });
});

router.get('/explore', authMiddleware, async (req, res) => {
    const user = await userController.getProfile(req.session.user.id);
    res.render('explore', { title: 'Explorar', user: user });
});

// ==========================================
// ROTAS DE API (Ações do Banco de Dados)
// ==========================================

router.post('/api/favorites/toggle', authMiddleware, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const podcastId = req.body.podcastId;

        const favorite = await Favorite.findOne({
            where: {
                userId: userId,
                podcastId: podcastId
            }
        });

        if (favorite) {
            await favorite.destroy();
            return res.status(200).json({ success: true, action: 'removed', message: 'Removido dos favoritos' });
        } else {
            await Favorite.create({
                userId,
                podcastId
            });
            return res.status(200).json({ success: true, action: 'added', message: 'Adicionado aos favoritos' });
        }

    } catch (error) {
        console.error('Erro ao atualizar favorito:', error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar favorito.' });
    }
});

router.post('/api/progress/save', authMiddleware, async (req, res) => {
    try {
        const { podcastId, currentTime } = req.body;
        const userId = req.session.user.id;

        let progress = await Progress.findOne({ where: { userId, podcastId } });

        if (progress) {
            progress.currentTime = currentTime;
            await progress.save();
        } else {
            await Progress.create({ userId, podcastId, currentTime });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        res.status(500).json({ success: false });
    }
});

router.get('/upload', authMiddleware, (req, res) => {
    res.render('upload', { 
        title: 'Publicar Podcast',
        user: req.session.user 
    });
});

router.get('/continue', authMiddleware, async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Busca o progresso e já traz os dados do podcast junto (Join)
        const progressRecords = await Progress.findAll({
            where: { userId: userId },
            include: [Podcast] 
        });

        // Monta o array que o EJS espera
        const podcasts = progressRecords.map(p => ({
            ...p.Podcast.toJSON(),
            currentTime: p.currentTime,
            totalTime: 3600 // Exemplo: defina o total do episódio ou busque no DB
        }));

        res.render('continue', { 
            title: 'Continuar Ouvindo', 
            user: req.session.user, 
            podcasts: podcasts 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao carregar");
    }
});
router.post('/profile/edit', authMiddleware, upload.single('profilePicture'), userController.updateProfile);

export default router;                                                      