import { useEffect, useState } from 'react';

/**
 * Barra de pesquisa com campo controlado e botão para limpar.
 */
export default function BarraPesquisa({ valor, aoMudar, aoLimpar }) {
  const [texto, setTexto] = useState(valor);

  // Mantém o campo sincronizado quando a pesquisa é limpa fora do componente
  useEffect(() => {
    setTexto(valor);
  }, [valor]);

  function enviar(evento) {
    evento.preventDefault();
    aoMudar(texto);
  }

  function limpar() {
    setTexto('');
    aoLimpar();
  }

  return (
    <form className="barra-pesquisa" role="search" onSubmit={enviar}>
      <label className="campo-pesquisa">
        <span className="icone-pesquisa" aria-hidden="true">
          🔍
        </span>
        <span className="texto-oculto">Pesquisar tarefas</span>
        <input
          type="search"
          name="busca"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Pesquisar tarefa pelo nome..."
          autoComplete="off"
        />
      </label>

      {valor ? (
        <button type="button" className="botao botao-fantasma" onClick={limpar}>
          Limpar
        </button>
      ) : (
        <button type="submit" className="botao botao-secundario">
          Pesquisar
        </button>
      )}
    </form>
  );
}
