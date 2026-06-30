import express from 'express';
const router = express.Router();

import userController from '../modules/user/userController.js'; 
import { authMiddleware } from '../middlewares/auth.js';
import adminMiddleware from '../middlewares/admin.js'; 
import upload from '../middlewares/multer.js';
import Favorite from '../modules/user/favoriteModel.js'; 
import Progress from '../modules/user/progressModel.js';
import Podcast from '../modules/podcast/podcastModel.js'; 
import User from '../modules/user/userModel.js';
import reviewController from '../modules/review/reviewController.js';

// ==========================================
// ROTAS PÚBLICAS
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

// ==========================================
// ROTAS LOGADAS (FEED E PERFIL)
// ==========================================

router.get('/feed', authMiddleware, async (req, res) => {
    try {
        const user = await userController.getProfile(req.session.user.id);
        
        // 1. Busca os favoritos
        const userFavorites = await Favorite.findAll({
            where: { userId: req.session.user.id }
        });
        const favoriteIds = userFavorites.map(fav => fav.podcastId.toString());

        // 2. O SEGREDO: Busca todos os progressos desse usuário
        const userProgress = await Progress.findAll({
            where: { userId: req.session.user.id }
        });
        
        // Cria um "dicionário" fácil pro HTML ler (ex: progressMap[1] = 120 segundos)
        const progressMap = {};
        userProgress.forEach(p => {
            const pId = p.podcastId || p.PodcastId;
            progressMap[pId] = p.currentTime;
        });

        // 3. Busca os podcasts reais no banco
        const podcasts = await Podcast.findAll({
            order: [['createdAt', 'DESC']]
        });

        // 4. Envia tudo para o EJS
        res.render('home', { 
            user: user, 
            favoriteIds: favoriteIds, 
            podcasts: podcasts,
            progressMap: progressMap // <--- Mapeamento de tempo enviado pra tela!
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

router.post('/profile/edit', authMiddleware, upload.single('profilePicture'), userController.updateProfile);

// ==========================================
// ROTA CONTINUAR OUVINDO (UNIFICADA E CORRIGIDA)
// ==========================================
router.get('/continue', authMiddleware, async (req, res) => {
    try {
        const user = req.session.user; // Pega o usuário logado
        
        // 1. Busca todos os progressos
        const progressRecords = await Progress.findAll({
            where: { userId: user.id }
        });

        const continuePodcasts = [];

        // 2. Varre os progressos e busca o podcast correspondente
        for (let record of progressRecords) {
            // TRAVA DE SEGURANÇA: Garante que vai achar o ID independente de como o Sequelize salvou
            const idDoPodcast = record.podcastId || record.PodcastId; 
            
            if (idDoPodcast) {
                const podcast = await Podcast.findByPk(idDoPodcast);
                if (podcast) {
                    const podData = podcast.toJSON();
                    podData.currentTime = record.currentTime; // Injeta o tempo exato
                    continuePodcasts.push(podData);
                }
            }
        }

        // 3. Renderiza a tela
        res.render('continue', { 
            title: 'Continuar Ouvindo', 
            user: user,
            podcasts: continuePodcasts 
        });
    } catch (error) {
        console.error('Erro na rota continuar ouvindo:', error);
        res.status(500).send("Erro interno.");
    }
});

// ==========================================
// ROTA DO ADMIN - PROTEGIDA E COM ESTATÍSTICAS
// ==========================================
router.get('/admin/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = req.session.user;
        
        const totalUsers = await User.count();
        const totalPodcasts = await Podcast.count();
        const totalFavorites = await Favorite.count();
        
        const podcasts = await Podcast.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        const stats = {
            users: totalUsers,
            podcasts: totalPodcasts,
            favorites: totalFavorites
        };

        res.render('admin/dashboard', { 
            title: 'Painel de Controle', 
            user: user,
            podcasts: podcasts,
            stats: stats 
        });
    } catch (error) {
        console.error('Erro ao carregar o dashboard do admin:', error);
        res.status(500).send("Erro interno ao carregar o painel.");
    }
});

router.get('/upload', authMiddleware, (req, res) => {
    res.render('upload', { 
        title: 'Publicar Podcast',
        user: req.session.user 
    });
});

// ==========================================
// ROTAS EXTRAS DO MENU
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
// ROTAS DE API (Ações de Background)
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

router.post('/api/reviews', authMiddleware, reviewController.addReview);

export default router;