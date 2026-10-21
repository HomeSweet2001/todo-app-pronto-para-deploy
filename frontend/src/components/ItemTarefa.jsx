import { useEffect, useState } from 'react';
import { situacaoPrazo } from '../utils/data.js';
import { urlDaImagem } from '../services/api.js';

function IconeEditar() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5 17.5 10.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconeExcluir() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13M10 11v5m4-5v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Cartão de uma única tarefa, com imagem, prazo, conclusão, edição e exclusão.
 */
export default function ItemTarefa({ tarefa, aoAlternar, aoEditar, aoExcluir, ocupado }) {
  const concluida = Boolean(tarefa.concluida);
  const prazo = situacaoPrazo(tarefa.prazo, concluida);
  const [imagemComErro, setImagemComErro] = useState(false);

  useEffect(() => {
    setImagemComErro(false);
  }, [tarefa.imagem]);

  const urlImagem = urlDaImagem(tarefa.imagem);

  return (
    <article className={`cartao-tarefa ${concluida ? 'esta-concluida' : ''}`}>
      <div className="miniatura" aria-hidden={!urlImagem}>
        {urlImagem && !imagemComErro ? (
          <img
            src={urlImagem}
            alt={`Imagem da tarefa: ${tarefa.nome}`}
            loading="lazy"
            onError={() => setImagemComErro(true)}
          />
        ) : (
          <span className="miniatura-vazia" title="Sem imagem">
            🗒️
          </span>
        )}
      </div>

      <div className="conteudo-tarefa">
        <label className="caixa-concluida">
          <input
            type="checkbox"
            checked={concluida}
            onChange={() => aoAlternar(tarefa)}
            disabled={ocupado}
            aria-label={
              concluida
                ? `Marcar "${tarefa.nome}" como não concluída`
                : `Marcar "${tarefa.nome}" como concluída`
            }
          />
          <span className="marca-caixa" aria-hidden="true" />
        </label>

        <div className="texto-tarefa">
          <h3 className="nome-tarefa">{tarefa.nome}</h3>
          <div className="meta-tarefa">
            <span className={`etiqueta-prazo ${prazo.classe}`}>
              <span aria-hidden="true">📅</span> {prazo.texto}
            </span>
            <span className={`etiqueta-status ${concluida ? 'status-concluida' : 'status-pendente'}`}>
              {concluida ? 'Concluída' : 'Pendente'}
            </span>
          </div>
        </div>
      </div>

      <div className="acoes-tarefa">
        <button
          type="button"
          className="botao-icone"
          onClick={() => aoEditar(tarefa)}
          disabled={ocupado}
          title="Editar tarefa"
          aria-label={`Editar a tarefa "${tarefa.nome}"`}
        >
          <IconeEditar />
        </button>
        <button
          type="button"
          className="botao-icone botao-icone-perigo"
          onClick={() => aoExcluir(tarefa)}
          disabled={ocupado}
          title="Excluir tarefa"
          aria-label={`Excluir a tarefa "${tarefa.nome}"`}
        >
          <IconeExcluir />
        </button>
      </div>
    </article>
  );
}
