import ItemTarefa from './ItemTarefa.jsx';

function Esqueleto() {
  return (
    <div className="cartao-tarefa esqueleto" aria-hidden="true">
      <div className="miniatura esqueleto-bloco" />
      <div className="conteudo-tarefa">
        <div className="esqueleto-linha" style={{ width: '60%' }} />
        <div className="esqueleto-linha" style={{ width: '35%' }} />
      </div>
    </div>
  );
}

/**
 * Lista de tarefas com estados de carregamento, erro e lista vazia.
 */
export default function ListaTarefas({
  tarefas,
  carregando,
  busca,
  aoAlternar,
  aoEditar,
  aoExcluir,
  idEmProcessamento
}) {
  if (carregando && tarefas.length === 0) {
    return (
      <section className="lista-tarefas" aria-label="Carregando tarefas" aria-busy="true">
        <Esqueleto />
        <Esqueleto />
        <Esqueleto />
      </section>
    );
  }

  if (tarefas.length === 0) {
    return (
      <div className="estado-vazio">
        <span className="estado-vazio-icone" aria-hidden="true">
          {busca ? '🔎' : '✅'}
        </span>
        <h2>{busca ? 'Nenhuma tarefa encontrada' : 'Sua lista está vazia'}</h2>
        <p>
          {busca
            ? 'Não encontramos tarefas com esse nome. Tente pesquisar por outro termo.'
            : 'Comece criando a sua primeira tarefa e mantenha o seu dia organizado.'}
        </p>
      </div>
    );
  }

  return (
    <section className="lista-tarefas" aria-label="Lista de tarefas" aria-busy={carregando}>
      {tarefas.map((tarefa) => (
        <ItemTarefa
          key={tarefa.id}
          tarefa={tarefa}
          aoAlternar={aoAlternar}
          aoEditar={aoEditar}
          aoExcluir={aoExcluir}
          ocupado={idEmProcessamento === tarefa.id}
        />
      ))}
    </section>
  );
}
