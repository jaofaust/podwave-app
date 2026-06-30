import Podcast from '../podcastModel.js';

const podcastService = {
    store: async (podcastData) => {
        if (!podcastData.title || !podcastData.audioUrl) {
            throw new Error('Título e Áudio são obrigatórios.');
        }

        const newPodcast = await Podcast.create(podcastData);
        return newPodcast;
    }
};

export default podcastService;