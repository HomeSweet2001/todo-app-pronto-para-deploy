'use strict';

const express = require('express');
const TarefaController = require('../controllers/tarefaController');
const { uploadImagem } = require('../middlewares/upload');

const rotas = express.Router();

// O campo do formulário com a imagem deve se chamar "imagem"
rotas.get('/', TarefaController.listar);
rotas.get('/:id', TarefaController.buscarPorId);
rotas.post('/', uploadImagem, TarefaController.criar);
rotas.put('/:id', uploadImagem, TarefaController.atualizar);
rotas.patch('/:id/concluida', TarefaController.alternarConcluida);
rotas.delete('/:id', TarefaController.excluir);

module.exports = rotas;
