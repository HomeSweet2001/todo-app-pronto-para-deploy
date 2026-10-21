'use strict';

const { pool } = require('../config/database');

/**
 * Camada Model (M do MVC): única responsável por falar com o MySQL.
 * Todas as consultas usam parâmetros (?) para evitar SQL Injection.
 */
const TarefaModel = {
  async listar(busca = '') {
    const termo = `%${busca.trim()}%`;

    const [linhas] = await pool.query(
      `SELECT id, imagem, nome, prazo, concluida, criado_em, atualizado_em
         FROM tarefas
        WHERE (? = '' OR nome LIKE ?)
        ORDER BY concluida ASC, prazo IS NULL ASC, prazo ASC, id DESC`,
      [busca.trim(), termo]
    );

    return linhas;
  },

  async buscarPorId(id) {
    const [linhas] = await pool.query(
      `SELECT id, imagem, nome, prazo, concluida, criado_em, atualizado_em
         FROM tarefas
        WHERE id = ?`,
      [id]
    );

    return linhas[0] || null;
  },

  async criar({ imagem, nome, prazo, concluida }) {
    const [resultado] = await pool.query(
      `INSERT INTO tarefas (imagem, nome, prazo, concluida)
       VALUES (?, ?, ?, ?)`,
      [imagem, nome, prazo, concluida ? 1 : 0]
    );

    return this.buscarPorId(resultado.insertId);
  },

  async atualizar(id, { imagem, nome, prazo, concluida }) {
    const [resultado] = await pool.query(
      `UPDATE tarefas
          SET imagem = ?, nome = ?, prazo = ?, concluida = ?
        WHERE id = ?`,
      [imagem, nome, prazo, concluida ? 1 : 0, id]
    );

    if (resultado.affectedRows === 0) {
      return null;
    }

    return this.buscarPorId(id);
  },

  async alternarConcluida(id) {
    const [resultado] = await pool.query(
      `UPDATE tarefas
          SET concluida = IF(concluida = 1, 0, 1)
        WHERE id = ?`,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return null;
    }

    return this.buscarPorId(id);
  },

  async excluir(id) {
    const [resultado] = await pool.query('DELETE FROM tarefas WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = TarefaModel;
