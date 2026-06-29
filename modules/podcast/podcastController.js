import Podcast from './podcastModel.js';

const podcastController = {
    store: async (req, res) => {
        try {
            const { title, category, author, description } = req.body;
            
            const audioFile = req.files['audioFile'] ? req.files['audioFile'][0] : null;
            const coverImage = req.files['coverImage'] ? req.files['coverImage'][0] : null;

            if (!title || !audioFile) {
                req.flash('error', 'Título e arquivo de áudio são campos obrigatórios.');
                return res.redirect('/admin/upload');
            }

            // Sanitiza os campos salvando puramente o filename gerado de forma única
            const audioUrl = audioFile.filename;
            const coverUrl = coverImage ? coverImage.filename : null;

            await Podcast.create({
                title,
                category,
                author,
                description,
                audioUrl,
                coverUrl
            });

            req.flash('success', 'Podcast publicado com sucesso!');
            res.redirect('/admin/dashboard');
        } catch (error) {
            console.error(error);
            req.flash('error', 'Ocorreu um erro interno ao persistir os dados.');
            res.redirect('/admin/upload');
        }
    }
};

export default podcastController;