-- ---------------------------------------------------------------------------
-- Script para banco GERENCIADO (Aiven, etc.)
-- Não cria o banco: use o que o provedor já criou (ex.: defaultdb).
-- Execute conectado ao banco, por exemplo:
--   mysql -h HOST -P PORTA -u avnadmin -p --ssl-ca=ca.pem defaultdb < database.cloud.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tarefas (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  imagem        VARCHAR(500) NULL,   -- nome do arquivo (local) ou URL completa (nuvem)
  nome          VARCHAR(150) NOT NULL,
  prazo         DATE NULL,
  concluida     TINYINT(1) NOT NULL DEFAULT 0,
  criado_em     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_nome (nome),
  KEY idx_concluida (concluida),
  KEY idx_prazo (prazo)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
