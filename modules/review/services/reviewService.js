import Review from '../reviewModel.js';
import Podcast from '../../podcast/podcastModel.js';
import User from '../../user/userModel.js';

const reviewService = {
    addReview: async (reviewData) => {
        const { userId, podcastId, rating, comment } = reviewData;

        // 1. Validação de campo obrigatório
        if (rating === undefined || rating === null) {
            throw new Error('A nota é obrigatória.');
        }

        // 2 e 3. Regra de negócio: Nota entre 1 e 5
        if (rating < 1 || rating > 5) {
            throw new Error('A nota deve ser entre 1 e 5.');
        }

        // 4. Integridade Referencial: Verifica se o Podcast existe
        const podcast = await Podcast.findByPk(podcastId);
        if (!podcast) {
            throw new Error('Podcast não encontrado.');
        }

        // 5. Integridade Referencial: Verifica se o Usuário existe
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('Usuário inválido.');
        }

        // 6. Prevenção de duplicidade: Usuário só avalia uma vez cada podcast
        const existingReview = await Review.findOne({ 
            where: { userId, podcastId } 
        });
        if (existingReview) {
            throw new Error('Você já avaliou este podcast.');
        }

        // 7. Moderação de conteúdo: Filtro básico de palavras impróprias
        if (comment && comment.toLowerCase().includes('lixo')) {
            throw new Error('Comentário contém palavras impróprias.');
        }

        // 8, 9 e 10. Persistência de dados
        const newReview = await Review.create({
            userId,
            podcastId,
            rating,
            comment: comment || null
        });

        return newReview;
    }
};

export default reviewService;