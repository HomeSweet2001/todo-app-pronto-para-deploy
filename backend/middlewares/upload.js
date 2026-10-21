'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

/**
 * Armazenamento de imagens com dois modos:
 *  - NUVEM (produção): ativado quando CLOUDINARY_URL está definida.
 *    As imagens vão para o Cloudinary e o banco guarda a URL completa (https://...).
 *  - LOCAL (desenvolvimento): sem CLOUDINARY_URL, grava em backend/uploads como antes.
 *
 * Em hospedagens gratuitas (Render, etc.) o disco é efêmero: arquivos gravados
 * localmente somem a cada reinício/deploy. Por isso a produção usa a nuvem.
 */
const USAR_CLOUDINARY = Boolean(process.env.CLOUDINARY_URL);
const PASTA_NUVEM = process.env.CLOUDINARY_FOLDER || 'todo-app';

if (USAR_CLOUDINARY) {
  cloudinary.config({ secure: true });
  console.log('[uploads] Modo nuvem: imagens serão enviadas ao Cloudinary.');
} else {
  console.log('[uploads] Modo local: imagens serão gravadas em backend/uploads.');
}

// Pasta onde as imagens ficam armazenadas no modo local: backend/uploads
const PASTA_UPLOADS = path.resolve(__dirname, '..', 'uploads');

if (!USAR_CLOUDINARY) {
  fs.mkdirSync(PASTA_UPLOADS, { recursive: true });
}

const EXTENSOES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

const armazenamento = USAR_CLOUDINARY
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, arquivo, cb) => cb(null, PASTA_UPLOADS),
      filename: (req, arquivo, cb) => {
        const extensao = path.extname(arquivo.originalname).toLowerCase();
        // Nome único: evita sobrescrever arquivos e problemas com acentos
        const nomeUnico = `${Date.now()}-${crypto.randomUUID()}${extensao}`;
        cb(null, nomeUnico);
      }
    });

function filtroDeArquivo(req, arquivo, cb) {
  const extensao = path.extname(arquivo.originalname).toLowerCase();
  const tipoValido = TIPOS_PERMITIDOS.includes(arquivo.mimetype);
  const extensaoValida = EXTENSOES_PERMITIDAS.includes(extensao);

  if (tipoValido && extensaoValida) {
    return cb(null, true);
  }

  const erro = new Error('Formato de imagem inválido. Envie JPG, PNG, GIF ou WEBP.');
  erro.status = 400;
  return cb(erro);
}

const upload = multer({
  storage: armazenamento,
  limits: { fileSize: TAMANHO_MAXIMO },
  fileFilter: filtroDeArquivo
});

/**
 * Middleware executado depois do multer. No modo nuvem, envia o arquivo da
 * memória para o Cloudinary e coloca a URL final em req.file.filename, de modo
 * que o controller continue funcionando sem alterações.
 */
function enviarParaNuvem(req, res, next) {
  if (!USAR_CLOUDINARY || !req.file) return next();

  const opcoes = {
    folder: PASTA_NUVEM,
    resource_type: 'image',
    public_id: `${Date.now()}-${crypto.randomUUID()}`
  };

  const stream = cloudinary.uploader.upload_stream(opcoes, (erroEnvio, resultado) => {
    if (erroEnvio || !resultado) {
      console.error('[uploads] Falha ao enviar ao Cloudinary:', erroEnvio && erroEnvio.message);
      const erro = new Error('Não foi possível enviar a imagem. Tente novamente.');
      erro.status = 502;
      return next(erro);
    }

    req.file.filename = resultado.secure_url;
    return next();
  });

  stream.end(req.file.buffer);
}

// Use nas rotas: substitui o antigo upload.single('imagem')
const uploadImagem = [upload.single('imagem'), enviarParaNuvem];

/**
 * Extrai o public_id do Cloudinary a partir da URL salva no banco.
 * Ex.: https://res.cloudinary.com/x/image/upload/v123/todo-app/abc.jpg -> todo-app/abc
 */
function publicIdDaUrl(url) {
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.endsWith('cloudinary.com')) return null;

    const correspondencia = pathname.match(/\/upload\/(?:v\d+\/)?(.+)\.[A-Za-z0-9]+$/);
    return correspondencia ? decodeURIComponent(correspondencia[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Remove uma imagem (da nuvem ou do disco) com segurança.
 * Ignora arquivos inexistentes e nunca lança erro.
 */
async function removerImagem(nomeArquivo) {
  if (!nomeArquivo) return;

  // Imagem na nuvem: o banco guarda a URL completa
  if (/^https?:\/\//i.test(String(nomeArquivo))) {
    if (!USAR_CLOUDINARY) return;

    const publicId = publicIdDaUrl(String(nomeArquivo));
    if (!publicId) return;

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (erro) {
      console.warn(`[uploads] Não foi possível remover ${publicId} do Cloudinary: ${erro.message}`);
    }
    return;
  }

  // Imagem local
  const nomeSeguro = path.basename(String(nomeArquivo));
  const caminho = path.join(PASTA_UPLOADS, nomeSeguro);

  // Impede qualquer tentativa de sair da pasta uploads
  if (!caminho.startsWith(PASTA_UPLOADS + path.sep)) return;

  try {
    await fs.promises.unlink(caminho);
  } catch (erro) {
    if (erro.code !== 'ENOENT') {
      console.warn(`[uploads] Não foi possível remover ${nomeSeguro}: ${erro.message}`);
    }
  }
}

module.exports = { upload, uploadImagem, PASTA_UPLOADS, removerImagem, TAMANHO_MAXIMO };
