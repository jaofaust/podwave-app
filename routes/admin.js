import express from 'express';
import User from '../modules/user/userModel.js';
import Podcast from '../modules/podcast/podcastModel.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.js';
// O IMPORT DEVE ESTAR AQUI:
import upload from '../middlewares/multer.js'; 
import podcastController from '../modules/podcast/podcastController.js';
import multer from 'multer'; // <--- Adicione esta linha

const router = express.Router();

// Dashboard
router.get('/dashboard', authMiddleware, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalPodcasts = await Podcast.count();
        res.render('admin/dashboard', { user: req.session.user, totalUsers, totalPodcasts });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao carregar o dashboard");
    }
});

// Listar Usuários
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
    try {
        const users = await User.findAll();
        res.render('admin/users', { user: req.session.user, users });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao carregar usuários");
    }
});

// Toggle Admin (Alternar entre User/Admin)
router.post('/users/toggle-admin', authMiddleware, isAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.body.userId);
        if (user) {
            user.role = (user.role === 'admin') ? 'user' : 'admin';
            await user.save();
            return res.json({ success: true });
        }
        res.status(404).json({ success: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// Deletar Usuário
router.post('/users/delete', authMiddleware, isAdmin, async (req, res) => {
    try {
        await User.destroy({ where: { id: req.body.userId } });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// Rota atualizada
router.post('/upload', upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), podcastController.store);

export default router;