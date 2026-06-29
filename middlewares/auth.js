export const authMiddleware = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    req.flash('error', 'Você precisa estar logado para acessar esta página.');
    return res.redirect('/login');
};

export const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).send("Acesso negado: Você não é um administrador.");
};