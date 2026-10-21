'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const rotasTarefas = require('./routes/tarefaRoutes');
const { PASTA_UPLOADS } = require('./middlewares/upload');
const { AuthController, exigirAutenticacao } = require('./middlewares/auth');

const app = express();

// Atrás do proxy da hospedagem (Render): permite obter o IP real do visitante
app.set('trust proxy', 1);

// ---------- Configurações gerais ----------
const origensPermitidas = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origensPermitidas.includes('*') ? true : origensPermitidas,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ---------- Arquivos estáticos (imagens enviadas) ----------
app.use(
  '/uploads',
  express.static(PASTA_UPLOADS, {
    maxAge: '1d',
    fallthrough: true,
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

// ---------- Rotas da API ----------
app.get('/api/saude', (req, res) => {
  res.json({ status: 'ok', mensagem: 'API da lista de tarefas está funcionando.' });
});

// Login com usuário fixo (público) e rotas protegidas por token
app.post('/api/login', AuthController.login);

app.use('/api/tarefas', exigirAutenticacao, rotasTarefas);

// ---------- Rota não encontrada ----------
app.use((req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada.' });
});

// ---------- Tratamento centralizado de erros ----------
app.use((erro, req, res, next) => {
  // Erros de validação de upload (formato/tipo de arquivo)
  if (erro && (erro.status === 400 || erro.status === 502)) {
    return res.status(erro.status).json({ mensagem: erro.message });
  }

  // Erros de upload (multer)
  if (erro && erro.name === 'MulterError') {
    const mensagens = {
      LIMIT_FILE_SIZE: 'A imagem deve ter no máximo 5 MB.',
      LIMIT_UNEXPECTED_FILE: 'Envie apenas uma imagem no campo "imagem" (JPG, PNG, GIF ou WEBP).'
    };

    return res.status(400).json({
      mensagem: mensagens[erro.code] || 'Não foi possível processar a imagem enviada.'
    });
  }

  // JSON malformado no corpo da requisição
  if (erro && erro.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'O corpo da requisição contém um JSON inválido.' });
  }

  // Erros do MySQL
  if (erro && erro.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ mensagem: 'Já existe um registro com esses dados.' });
  }

  if (erro && (erro.code === 'ECONNREFUSED' || erro.code === 'ER_ACCESS_DENIED_ERROR')) {
    console.error('[erro] Falha de conexão com o banco:', erro.message);
    return res.status(503).json({
      mensagem: 'Não foi possível conectar ao banco de dados. Tente novamente em instantes.'
    });
  }

  console.error('[erro]', erro);
  return res.status(500).json({ mensagem: 'Erro interno no servidor.' });
});

module.exports = app;
