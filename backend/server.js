'use strict';

require('dotenv').config();

const app = require('./app');
const { testarConexao, pool } = require('./config/database');

const PORTA = Number(process.env.PORT) || 3001;

async function iniciar() {
  try {
    await testarConexao();

    const servidor = app.listen(PORTA, () => {
      console.log(`[servidor] API disponível em http://localhost:${PORTA}`);
      console.log(`[servidor] Imagens em http://localhost:${PORTA}/uploads`);
    });

    const encerrar = async (sinal) => {
      console.log(`\n[servidor] Recebido ${sinal}. Encerrando...`);
      servidor.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => encerrar('SIGINT'));
    process.on('SIGTERM', () => encerrar('SIGTERM'));
  } catch (erro) {
    console.error('[servidor] Encerrando por falha na inicialização.');
    process.exit(1);
  }
}

iniciar();
