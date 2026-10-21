import { useCallback, useEffect, useMemo, useState } from 'react';
import BarraPesquisa from './components/BarraPesquisa.jsx';
import FormularioTarefa from './components/FormularioTarefa.jsx';
import ListaTarefas from './components/ListaTarefas.jsx';
import {
  alternarConcluida,
  atualizarTarefa,
  criarTarefa,
  excluirTarefa,
  listarTarefas
} from './services/api.js';

export default function Painel({ aoSair }) {
  const [tarefas, setTarefas] = useState([]);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [tarefaEmEdicao, setTarefaEmEdicao] = useState(null);
  const [idEmProcessamento, setIdEmProcessamento] = useState(null);
  const [versao, setVersao] = useState(0);

  // Espera o usuário parar de digitar antes de pesquisar (debounce)
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBuscaAplicada(busca.trim());
    }, 350);

    return () => clearTimeout(temporizador);
  }, [busca]);

  // Carrega as tarefas sempre que a pesquisa ou a versão mudar
  useEffect(() => {
    const controlador = new AbortController();

    async function carregar() {
      setCarregando(true);

      try {
        const dados = await listarTarefas(buscaAplicada, controlador.signal);
        setTarefas(Array.isArray(dados) ? dados : []);
        setErro('');
      } catch (falha) {
        if (falha.name !== 'AbortError') {
          setErro(falha.message || 'Não foi possível carregar as tarefas.');
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => controlador.abort();
  }, [buscaAplicada, versao]);

  // Esconde a mensagem de sucesso após alguns segundos
  useEffect(() => {
    if (!aviso) return undefined;

    const temporizador = setTimeout(() => setAviso(''), 4000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const estatisticas = useMemo(() => {
    const total = tarefas.length;
    const concluidas = tarefas.filter((tarefa) => Boolean(tarefa.concluida)).length;
    return { total, concluidas, pendentes: total - concluidas };
  }, [tarefas]);

  const recarregar = useCallback(() => setVersao((valor) => valor + 1), []);

  const abrirNovaTarefa = useCallback(() => {
    setTarefaEmEdicao(null);
    setFormularioAberto(true);
  }, []);

  const abrirEdicao = useCallback((tarefa) => {
    setTarefaEmEdicao(tarefa);
    setFormularioAberto(true);
  }, []);

  const fecharFormulario = useCallback(() => {
    setFormularioAberto(false);
    setTarefaEmEdicao(null);
  }, []);

  async function salvarTarefa(dados) {
    const editando = Boolean(tarefaEmEdicao);

    const tarefaSalva = editando
      ? await atualizarTarefa(tarefaEmEdicao.id, dados)
      : await criarTarefa(dados);

    setTarefas((anteriores) =>
      editando
        ? anteriores.map((tarefa) => (tarefa.id === tarefaSalva.id ? tarefaSalva : tarefa))
        : [tarefaSalva, ...anteriores]
    );

    fecharFormulario();
    setAviso(editando ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.');
    recarregar();
  }

  async function alternarTarefa(tarefa) {
    setIdEmProcessamento(tarefa.id);

    try {
      const atualizada = await alternarConcluida(tarefa.id);

      setTarefas((anteriores) =>
        anteriores.map((item) => (item.id === atualizada.id ? atualizada : item))
      );

      setAviso(atualizada.concluida ? 'Tarefa marcada como concluída.' : 'Tarefa reaberta.');
    } catch (falha) {
      setErro(falha.message || 'Não foi possível atualizar a tarefa.');
    } finally {
      setIdEmProcessamento(null);
    }
  }

  async function excluirTarefaConfirmado(tarefa) {
    const confirmado = window.confirm(
      `Tem certeza de que deseja excluir a tarefa "${tarefa.nome}"? Essa ação não pode ser desfeita.`
    );

    if (!confirmado) return;

    setIdEmProcessamento(tarefa.id);

    try {
      await excluirTarefa(tarefa.id);
      setTarefas((anteriores) => anteriores.filter((item) => item.id !== tarefa.id));
      setAviso('Tarefa excluída com sucesso.');
    } catch (falha) {
      setErro(falha.message || 'Não foi possível excluir a tarefa.');
    } finally {
      setIdEmProcessamento(null);
    }
  }

  return (
    <div className="aplicativo">
      <header className="cabecalho-app">
        <div className="identidade">
          <span className="logotipo" aria-hidden="true">
            ✓
          </span>
          <div>
            <p className="subtitulo-app">Organize o seu dia</p>
            <h1>Minha Lista de Tarefas</h1>
            <p className="descricao-app">
              Crie tarefas com imagem e prazo, pesquise, conclua, edite ou exclua quando quiser.
            </p>
          </div>
        </div>

        <section className="painel-estatisticas" aria-label="Resumo das tarefas">
          <div className="estatistica">
            <span className="estatistica-valor">{estatisticas.total}</span>
            <span className="estatistica-rotulo">Total</span>
          </div>
          <div className="estatistica estatistica-pendente">
            <span className="estatistica-valor">{estatisticas.pendentes}</span>
            <span className="estatistica-rotulo">Pendentes</span>
          </div>
          <div className="estatistica estatistica-concluida">
            <span className="estatistica-valor">{estatisticas.concluidas}</span>
            <span className="estatistica-rotulo">Concluídas</span>
          </div>
        </section>
      </header>

      <main>
        <section className="barra-ferramentas" aria-label="Pesquisa e criação de tarefas">
          <BarraPesquisa
            valor={busca}
            aoMudar={setBusca}
            aoLimpar={() => setBusca('')}
          />

          <button type="button" className="botao botao-primario botao-nova" onClick={abrirNovaTarefa}>
            <span aria-hidden="true">＋</span> Nova tarefa
          </button>

          <button type="button" className="botao botao-fantasma botao-sair" onClick={aoSair}>
            Sair
          </button>
        </section>

        {erro && (
          <div className="mensagem-erro banner-erro" role="alert">
            <span>{erro}</span>
            <button type="button" className="botao botao-fantasma" onClick={recarregar}>
              Tentar novamente
            </button>
          </div>
        )}

        {buscaAplicada && !carregando && tarefas.length > 0 && (
          <p className="resultado-pesquisa" aria-live="polite">
            {tarefas.length}{' '}
            {tarefas.length === 1 ? 'tarefa encontrada' : 'tarefas encontradas'} para{' '}
            <strong>“{buscaAplicada}”</strong>
          </p>
        )}

        <ListaTarefas
          tarefas={tarefas}
          carregando={carregando}
          busca={buscaAplicada}
          aoAlternar={alternarTarefa}
          aoEditar={abrirEdicao}
          aoExcluir={excluirTarefaConfirmado}
          idEmProcessamento={idEmProcessamento}
        />
      </main>

      <footer className="rodape">
        <p>Feito com React, Node.js e MySQL — arquitetura MVC.</p>
      </footer>

      {formularioAberto && (
        <FormularioTarefa
          key={tarefaEmEdicao ? `edicao-${tarefaEmEdicao.id}` : 'nova'}
          tarefa={tarefaEmEdicao}
          aoFechar={fecharFormulario}
          aoSalvar={salvarTarefa}
        />
      )}

      {aviso && (
        <div className="aviso-sucesso" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span> {aviso}
        </div>
      )}
    </div>
  );
}
