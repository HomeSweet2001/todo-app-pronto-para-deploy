'use strict';

const TarefaModel = require('../models/tarefaModel');
const { removerImagem } = require('../middlewares/upload');

/**
 * Camada Controller (C do MVC): recebe a requisição, valida os dados,
 * chama o Model e devolve a resposta HTTP.
 */

function converterConcluida(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    return ['1', 'true', 'sim', 'on'].includes(valor.trim().toLowerCase());
  }
  return false;
}

function validarId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarPrazo(valor) {
  if (valor === undefined || valor === null || valor === '') return null;

  const texto = String(valor).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return undefined;

  // Valida a data real (evita aceitar 31/02, por exemplo)
  const [ano, mes, dia] = texto.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  const dataValida =
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia;

  if (!dataValida) return undefined;

  return texto;
}

function validarDados(corpo) {
  const erros = [];
  const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : '';

  if (!nome) {
    erros.push('O nome da tarefa é obrigatório.');
  } else if (nome.length > 150) {
    erros.push('O nome da tarefa deve ter no máximo 150 caracteres.');
  }

  const prazo = validarPrazo(corpo.prazo);
  if (prazo === undefined) {
    erros.push('O prazo deve ser uma data válida no formato AAAA-MM-DD.');
  }

  return {
    erros,
    dados: {
      nome,
      prazo: prazo === undefined ? null : prazo,
      concluida: converterConcluida(corpo.concluida)
    }
  };
}

const TarefaController = {
  async listar(req, res, next) {
    try {
      const busca = typeof req.query.busca === 'string' ? req.query.busca : '';
      const tarefas = await TarefaModel.listar(busca);
      return res.json(tarefas);
    } catch (erro) {
      return next(erro);
    }
  },

  async buscarPorId(req, res, next) {
    try {
      const id = validarId(req.params.id);
      if (!id) {
        return res.status(400).json({ mensagem: 'Identificador inválido.' });
      }

      const tarefa = await TarefaModel.buscarPorId(id);
      if (!tarefa) {
        return res.status(404).json({ mensagem: 'Tarefa não encontrada.' });
      }

      return res.json(tarefa);
    } catch (erro) {
      return next(erro);
    }
  },

  async criar(req, res, next) {
    const arquivoEnviado = req.file ? req.file.filename : null;

    try {
      const { erros, dados } = validarDados(req.body);

      if (erros.length > 0) {
        // Não deixa arquivo órfão na pasta uploads
        await removerImagem(arquivoEnviado);
        return res.status(400).json({ mensagem: erros[0], erros });
      }

      const tarefa = await TarefaModel.criar({
        ...dados,
        imagem: arquivoEnviado
      });

      return res.status(201).json(tarefa);
    } catch (erro) {
      await removerImagem(arquivoEnviado);
      return next(erro);
    }
  },

  async atualizar(req, res, next) {
    const arquivoEnviado = req.file ? req.file.filename : null;
    let imagemAntiga = null;

    try {
      const id = validarId(req.params.id);
      if (!id) {
        await removerImagem(arquivoEnviado);
        return res.status(400).json({ mensagem: 'Identificador inválido.' });
      }

      const tarefaAtual = await TarefaModel.buscarPorId(id);
      if (!tarefaAtual) {
        await removerImagem(arquivoEnviado);
        return res.status(404).json({ mensagem: 'Tarefa não encontrada.' });
      }

      const { erros, dados } = validarDados(req.body);
      if (erros.length > 0) {
        await removerImagem(arquivoEnviado);
        return res.status(400).json({ mensagem: erros[0], erros });
      }

      imagemAntiga = tarefaAtual.imagem;

      const removerImagemAtual = converterConcluida(req.body.removerImagem);
      let novaImagem = tarefaAtual.imagem;

      if (arquivoEnviado) {
        novaImagem = arquivoEnviado;
      } else if (removerImagemAtual) {
        novaImagem = null;
      }

      const tarefa = await TarefaModel.atualizar(id, {
        ...dados,
        imagem: novaImagem
      });

      // Só remove o arquivo antigo depois de atualizar o banco com sucesso
      if (imagemAntiga && imagemAntiga !== novaImagem) {
        await removerImagem(imagemAntiga);
      }

      return res.json(tarefa);
    } catch (erro) {
      await removerImagem(arquivoEnviado);
      return next(erro);
    }
  },

  async alternarConcluida(req, res, next) {
    try {
      const id = validarId(req.params.id);
      if (!id) {
        return res.status(400).json({ mensagem: 'Identificador inválido.' });
      }

      const tarefa = await TarefaModel.alternarConcluida(id);
      if (!tarefa) {
        return res.status(404).json({ mensagem: 'Tarefa não encontrada.' });
      }

      return res.json(tarefa);
    } catch (erro) {
      return next(erro);
    }
  },

  async excluir(req, res, next) {
    try {
      const id = validarId(req.params.id);
      if (!id) {
        return res.status(400).json({ mensagem: 'Identificador inválido.' });
      }

      const tarefa = await TarefaModel.buscarPorId(id);
      if (!tarefa) {
        return res.status(404).json({ mensagem: 'Tarefa não encontrada.' });
      }

      await TarefaModel.excluir(id);
      await removerImagem(tarefa.imagem);

      return res.status(204).send();
    } catch (erro) {
      return next(erro);
    }
  }
};

module.exports = TarefaController;
