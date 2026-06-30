import reviewService from './services/reviewService.js';

const reviewController = {
    addReview: async (req, res) => {
        try {
            // Captura os dados do corpo da requisição e injeta o ID do utilizador logado na sessão
            const reviewData = {
                userId: req.session.user.id,
                podcastId: req.body.podcastId,
                rating: req.body.rating,
                comment: req.body.comment
            };

            const newReview = await reviewService.addReview(reviewData);
            
            // Retorna o status 211 (Created) em caso de sucesso absoluto
            return res.status(201).json({ success: true, data: newReview });
        } catch (error) {
            console.error(error);
            
            // Mapeamento cirúrgico de erros para status codes HTTP correspondentes
            if (error.message === 'Podcast não encontrado.') {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message === 'Você já avaliou este podcast.') {
                return res.status(409).json({ success: false, message: error.message });
            }
            if (error.message === 'A nota é obrigatória.' || 
                error.message === 'A nota deve ser entre 1 e 5.' || 
                error.message === 'Usuário inválido.' ||
                error.message === 'Comentário contém palavras impróprias.') {
                return res.status(400).json({ success: false, message: error.message });
            }

            return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
        }
    }
};

export default reviewController;