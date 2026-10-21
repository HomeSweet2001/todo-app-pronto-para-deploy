-- ---------------------------------------------------------------------------
-- Banco de dados da lista de tarefas
-- Execute este arquivo no MySQL: mysql -u root -p < database.sql
-- ---------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS todo_list
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE todo_list;

CREATE TABLE IF NOT EXISTS tarefas (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  imagem        VARCHAR(255) NULL,
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

-- Exemplos (opcionais). Podem ser removidos sem prejuízo.
INSERT INTO tarefas (nome, prazo, concluida) VALUES
  ('Revisar a documentação do projeto', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 0),
  ('Enviar o relatório mensal', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 0),
  ('Organizar as tarefas da semana', CURDATE(), 1);
