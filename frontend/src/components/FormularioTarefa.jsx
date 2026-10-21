import { useEffect, useState } from 'react';
import { urlDaImagem } from '../services/api.js';

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

/**
 * Modal de criação e edição de tarefas.
 * Campo de imagem, nome, prazo e situação (concluída ou não).
 */
export default function FormularioTarefa({ tarefa, aoFechar, aoSalvar }) {
  const editando = Boolean(tarefa);
  const [nome, setNome] = useState(tarefa?.nome ?? '');
  const [prazo, setPrazo] = useState(tarefa?.prazo ? String(tarefa.prazo).slice(0, 10) : '');
  const [concluida, setConcluida] = useState(Boolean(tarefa?.concluida));
  const [arquivo, setArquivo] = useState(null);
  const [previa, setPrevia] = useState(tarefa?.imagem ? urlDaImagem(tarefa.imagem) : null);
  const [removerImagem, setRemoverImagem] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Bloqueia a rolagem do fundo e permite fechar com a tecla Esc
  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function aoPressionarTecla(evento) {
      if (evento.key === 'Escape' && !enviando) {
        aoFechar();
      }
    }

    document.addEventListener('keydown', aoPressionarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', aoPressionarTecla);
    };
  }, [aoFechar, enviando]);

  // Cria e libera a URL de pré-visualização da imagem escolhida
  useEffect(() => {
    if (!arquivo) return undefined;

    const url = URL.createObjectURL(arquivo);
    setPrevia(url);

    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  function escolherArquivo(evento) {
    const selecionado = evento.target.files?.[0] ?? null;

    if (!selecionado) {
      setArquivo(null);
      return;
    }

    if (!selecionado.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem (JPG, PNG, GIF ou WEBP).');
      evento.target.value = '';
      return;
    }

    if (selecionado.size > TAMANHO_MAXIMO) {
      setErro('A imagem deve ter no máximo 5 MB.');
      evento.target.value = '';
      return;
    }

    setErro('');
    setArquivo(selecionado);
    setRemoverImagem(false);
  }

  function removerImagemSelecionada() {
    setArquivo(null);
    setPrevia(null);
    setRemoverImagem(true);
  }

  async function enviar(evento) {
    evento.preventDefault();

    const nomeLimpo = nome.trim();

    if (!nomeLimpo) {
      setErro('Informe o nome da tarefa.');
      return;
    }

    if (nomeLimpo.length > 150) {
      setErro('O nome da tarefa deve ter no máximo 150 caracteres.');
      return;
    }

    setErro('');
    setEnviando(true);

    try {
      await aoSalvar({
        nome: nomeLimpo,
        prazo: prazo || '',
        concluida,
        imagem: arquivo,
        removerImagem: removerImagem && !arquivo
      });
    } catch (falha) {
      setErro(falha.message || 'Não foi possível salvar a tarefa.');
      setEnviando(false);
    }
  }

  function fecharAoClicarFora(evento) {
    if (evento.target === evento.currentTarget && !enviando) {
      aoFechar();
    }
  }

  return (
    <div className="sobreposicao" onMouseDown={fecharAoClicarFora}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <h2 id="titulo-modal">{editando ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button
            type="button"
            className="botao-fechar"
            onClick={aoFechar}
            disabled={enviando}
            aria-label="Fechar formulário"
          >
            ×
          </button>
        </header>

        <form className="formulario" onSubmit={enviar} noValidate>
          <div className="campo">
            <label htmlFor="nome">Nome da tarefa</label>
            <input
              id="nome"
              name="nome"
              type="text"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              placeholder="Ex.: Revisar o relatório mensal"
              maxLength={150}
              autoFocus
              required
            />
            <small className="contador">{nome.length}/150</small>
          </div>

          <div className="campo">
            <label htmlFor="prazo">Prazo</label>
            <input
              id="prazo"
              name="prazo"
              type="date"
              value={prazo}
              onChange={(evento) => setPrazo(evento.target.value)}
            />
            <small className="ajuda">Deixe em branco caso a tarefa não tenha prazo.</small>
          </div>

          <div className="campo">
            <span className="rotulo-grupo">Imagem da tarefa</span>

            <div className="area-imagem">
              {previa ? (
                <div className="previa-imagem">
                  <img src={previa} alt="Pré-visualização da imagem selecionada" />
                  <button
                    type="button"
                    className="botao-remover-imagem"
                    onClick={removerImagemSelecionada}
                    aria-label="Remover imagem"
                  >
                    Remover imagem
                  </button>
                </div>
              ) : (
                <label className="seletor-imagem" htmlFor="imagem">
                  <span aria-hidden="true">🖼️</span>
                  <span>Escolher imagem</span>
                  <small>JPG, PNG, GIF ou WEBP — até 5 MB</small>
                </label>
              )}

              <input
                id="imagem"
                name="imagem"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={escolherArquivo}
                className={previa ? 'entrada-arquivo' : 'texto-oculto'}
              />
            </div>
          </div>

          <label className="campo-concluida">
            <input
              type="checkbox"
              checked={concluida}
              onChange={(evento) => setConcluida(evento.target.checked)}
            />
            <span>Tarefa concluída</span>
          </label>

          {erro && (
            <p className="mensagem-erro" role="alert">
              {erro}
            </p>
          )}

          <footer className="modal-acoes">
            <button type="button" className="botao botao-fantasma" onClick={aoFechar} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario" disabled={enviando}>
              {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar tarefa'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
