import createError from 'http-errors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import session from 'express-session';
import flash from 'connect-flash';

// Configuração do banco de dados e modelos
import sequelize from './config/database.js';
import User from './modules/user/userModel.js';
import Podcast from './modules/podcast/podcastModel.js'; // Sincroniza a tabela corretamente

// Importação das Rotas
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';

// Configuração do __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sincronização com o Banco de Dados
sequelize.sync({ alter: true })
    .then(() => console.log('Banco sincronizado!'))
    .catch(err => console.error('Erro ao sincronizar banco:', err));

const app = express();

// Configuração do View Engine (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares Globais de Configuração e Parser
app.use(logger('dev'));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));
app.use(cookieParser());

// Configuração de Pastas Estáticas
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração de Sessão (Precisa vir ANTES do Flash e das Rotas)
app.use(session({
  secret: 'segredo_super_secreto', 
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Configuração do Connect-Flash e variáveis de contexto locais
app.use(flash());
app.use((req, res, next) => { 
  res.locals.messages = req.flash();
  res.locals.user = req.session.user || null; 
  next();
});

// Registro das Rotas da Aplicação
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

// Middleware para tratamento de erro 404 (Rota não encontrada)
app.use((req, res, next) => { 
  next(createError(404)); 
});

// Middleware Global de Tratamento de Erros da Aplicação
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

export default app;