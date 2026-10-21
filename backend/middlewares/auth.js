'use strict';

const crypto = require('crypto');

/**
 * Autenticação com usuário fixo (sem tabela no banco).
 *
 * Padrão: usuário "admin" e senha "123". Para trocar em produção sem mexer no
 * código, defina AUTH_USER e AUTH_PASSWORD nas variáveis de ambiente.
 *
 * O login devolve um token assinado (HMAC-SHA256) com validade. As rotas da API
 * de tarefas exigem esse token no cabeçalho "Authorization: Bearer <token>".
 */
const USUARIO = process.env.AUTH_USER || 'admin';
const SENHA = process.env.AUTH_PASSWORD || '123';
const VALIDADE_MS = (Number(process.env.AUTH_TTL_HORAS) || 12) * 60 * 60 * 1000;

// Segredo de assinatura: use AUTH_SECRET em produção. Sem ele, deriva das credenciais
// (assim os tokens continuam válidos se o servidor reiniciar, comum no plano gratuito).
const SEGREDO =
  process.env.AUTH_SECRET ||
  crypto.createHash('sha256').update(`todo-app:${USUARIO}:${SENHA}`).digest('hex');

function assinar(conteudo) {
  return crypto.createHmac('sha256', SEGREDO).update(conteudo).digest('base64url');
}

function compararSeguro(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function gerarToken() {
  const conteudo = Buffer.from(
    JSON.stringify({ usuario: USUARIO, expira: Date.now() + VALIDADE_MS })
  ).toString('base64url');

  return `${conteudo}.${assinar(conteudo)}`;
}

function tokenValido(token) {
  if (typeof token !== 'string') return false;

  const [conteudo, assinatura] = token.split('.');
  if (!conteudo || !assinatura) return false;

  if (!compararSeguro(assinatura, assinar(conteudo))) return false;

  try {
    const { expira } = JSON.parse(Buffer.from(conteudo, 'base64url').toString('utf8'));
    return Number.isFinite(expira) && expira > Date.now();
  } catch {
    return false;
  }
}

// ---------- Limite de tentativas de login (por IP, em memória) ----------
const MAX_TENTATIVAS = 10;
const JANELA_MS = 15 * 60 * 1000;
const tentativas = new Map();

function registrarFalha(ip) {
  const agora = Date.now();
  const registro = tentativas.get(ip);

  if (!registro || registro.expira < agora) {
    tentativas.set(ip, { total: 1, expira: agora + JANELA_MS });
    return;
  }

  registro.total += 1;
}

function bloqueado(ip) {
  const registro = tentativas.get(ip);
  if (!registro) return false;

  if (registro.expira < Date.now()) {
    tentativas.delete(ip);
    return false;
  }

  return registro.total >= MAX_TENTATIVAS;
}

const AuthController = {
  login(req, res) {
    const ip = req.ip;

    if (bloqueado(ip)) {
      return res
        .status(429)
        .json({ mensagem: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
    }

    const { usuario, senha } = req.body || {};

    const credenciaisCorretas =
      typeof usuario === 'string' &&
      typeof senha === 'string' &&
      compararSeguro(usuario.trim(), USUARIO) &&
      compararSeguro(senha, SENHA);

    if (!credenciaisCorretas) {
      registrarFalha(ip);
      return res.status(401).json({ mensagem: 'Usuário ou senha incorretos.' });
    }

    tentativas.delete(ip);
    return res.json({ token: gerarToken() });
  }
};

function exigirAutenticacao(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';

  if (!tokenValido(token)) {
    return res.status(401).json({ mensagem: 'Sessão expirada. Faça login novamente.' });
  }

  return next();
}

module.exports = { AuthController, exigirAutenticacao };
