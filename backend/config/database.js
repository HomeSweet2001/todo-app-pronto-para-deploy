'use strict';

require('dotenv').config();

const mysql = require('mysql2/promise');

/**
 * Configuração centralizada da conexão com o MySQL.
 * Todos os dados vêm de variáveis de ambiente (arquivo .env).
 */
/**
 * SSL: bancos gerenciados (Aiven, TiDB, etc.) exigem conexão criptografada.
 *  - DB_SSL_CA   : conteúdo do certificado CA (recomendado; "\n" literal é aceito)
 *  - DB_SSL=true : liga o SSL sem validar o certificado (alternativa mais simples)
 */
function montarSsl() {
  const ca = process.env.DB_SSL_CA;
  if (ca) {
    return { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  }
  if (String(process.env.DB_SSL).toLowerCase() === 'true') {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

const ssl = montarSsl();

const configuracao = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'todo_list',
  charset: 'utf8mb4', // garante acentuação correta (á, ç, ã, é...)
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL) || 10,
  queueLimit: 0,
  dateStrings: true, // retorna DATE como 'YYYY-MM-DD' (evita fuso horário)
  timezone: process.env.DB_TIMEZONE || '-03:00',
  ...(ssl && { ssl })
};

const pool = mysql.createPool(configuracao);

/**
 * Testa a conexão ao iniciar o servidor.
 * Lança um erro amigável caso o banco não esteja acessível.
 */
async function testarConexao() {
  try {
    const conexao = await pool.getConnection();
    await conexao.query('SELECT 1');
    conexao.release();
    console.log(
      `[banco] Conectado com sucesso ao MySQL em ${configuracao.host}:${configuracao.port}/${configuracao.database}`
    );
  } catch (erro) {
    console.error('[banco] Não foi possível conectar ao MySQL.');
    console.error(`[banco] Detalhe: ${erro.message}`);
    console.error(
      '[banco] Verifique o arquivo .env e se o banco "' +
        configuracao.database +
        '" já foi criado (veja database.sql).'
    );
    throw erro;
  }
}

module.exports = { pool, testarConexao };
