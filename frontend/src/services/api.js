// Serviço central de comunicação com a API (Node/Express + MySQL)
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

// URL do servidor sem o sufixo /api — usada para montar o caminho das imagens
export const URL_SERVIDOR = BASE_URL.replace(/\/api$/, '');

/**
 * Monta a URL pública de uma imagem salva na pasta uploads do backend.
 */
export function urlDaImagem(imagem) {
  if (!imagem) return null;
  if (/^https?:\/\//i.test(imagem)) return imagem;
  return `${URL_SERVIDOR}/uploads/${encodeURIComponent(imagem)}`;
}

// ---------- Sessão (token guardado só enquanto a aba estiver aberta) ----------
const CHAVE_TOKEN = 'todo-token';
export const EVENTO_SESSAO_EXPIRADA = 'todo-sessao-expirada';

function lerToken() {
  try {
    return sessionStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function temSessao() {
  return Boolean(lerToken());
}

export function sair() {
  try {
    sessionStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // armazenamento indisponível: nada a limpar
  }
}

/**
 * Faz o login. Em caso de sucesso, guarda o token da sessão.
 */
export async function entrar(usuario, senha) {
  const resposta = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha })
  });

  const corpo = await tratarResposta(resposta);

  try {
    sessionStorage.setItem(CHAVE_TOKEN, corpo.token);
  } catch {
    throw new Error('Não foi possível iniciar a sessão neste navegador.');
  }
}

/**
 * fetch que envia o token. Se a API responder 401, encerra a sessão
 * e avisa o aplicativo para voltar à tela de login.
 */
async function requisitar(url, opcoes = {}) {
  const token = lerToken();

  const resposta = await fetch(url, {
    ...opcoes,
    headers: { ...(opcoes.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });

  if (resposta.status === 401) {
    sair();
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
  }

  return resposta;
}

async function tratarResposta(resposta) {
  if (resposta.status === 204) return null;

  const texto = await resposta.text();
  let corpo = null;

  if (texto) {
    try {
      corpo = JSON.parse(texto);
    } catch {
      corpo = null;
    }
  }

  if (!resposta.ok) {
    const erro = new Error(
      (corpo && corpo.mensagem) || 'Não foi possível concluir a operação. Tente novamente.'
    );
    erro.status = resposta.status;
    throw erro;
  }

  return corpo;
}

/**
 * Lista as tarefas, opcionalmente filtrando pelo termo de pesquisa.
 */
export async function listarTarefas(busca = '', sinal) {
  const parametros = busca.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : '';
  const resposta = await requisitar(`${BASE_URL}/tarefas${parametros}`, { signal: sinal });
  return tratarResposta(resposta);
}

/**
 * Cria uma tarefa. A imagem é enviada como multipart/form-data no campo "imagem".
 */
export async function criarTarefa(dados) {
  const resposta = await requisitar(`${BASE_URL}/tarefas`, {
    method: 'POST',
    body: montarFormData(dados)
  });

  return tratarResposta(resposta);
}

/**
 * Atualiza uma tarefa existente.
 */
export async function atualizarTarefa(id, dados) {
  const resposta = await requisitar(`${BASE_URL}/tarefas/${id}`, {
    method: 'PUT',
    body: montarFormData(dados)
  });

  return tratarResposta(resposta);
}

/**
 * Alterna entre concluída e não concluída.
 */
export async function alternarConcluida(id) {
  const resposta = await requisitar(`${BASE_URL}/tarefas/${id}/concluida`, {
    method: 'PATCH'
  });

  return tratarResposta(resposta);
}

/**
 * Exclui uma tarefa (e a imagem correspondente no servidor).
 */
export async function excluirTarefa(id) {
  const resposta = await requisitar(`${BASE_URL}/tarefas/${id}`, {
    method: 'DELETE'
  });

  return tratarResposta(resposta);
}

function montarFormData({ nome, prazo, concluida, imagem, removerImagem = false }) {
  const formData = new FormData();

  formData.append('nome', nome ?? '');
  formData.append('prazo', prazo ?? '');
  formData.append('concluida', concluida ? '1' : '0');

  if (imagem) {
    formData.append('imagem', imagem);
  }

  if (removerImagem) {
    formData.append('removerImagem', '1');
  }

  return formData;
}
