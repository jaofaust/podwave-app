const adminMiddleware = (req, res, next) => {
    // 1. Verifica se o usuário tem uma sessão ativa e se a role é 'admin'
    if (req.session.user && req.session.user.role === 'admin') {
        return next(); // Usuário é admin! Permite que ele continue para a rota
    }

    // 2. Se não for admin, barra o acesso, envia uma mensagem e redireciona
    req.flash('error', 'Acesso negado. Esta área é restrita para administradores.');
    return res.redirect('/feed');
};

export default adminMiddleware;