/**
 * Utilitários de data e prazo (sempre no fuso local do navegador).
 */

export function dataLocalISO(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function formatarData(valor) {
  if (!valor) return '';

  const partes = String(valor).slice(0, 10).split('-');
  if (partes.length !== 3) return String(valor);

  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

/**
 * Retorna o rótulo e a classe visual do prazo de uma tarefa.
 */
export function situacaoPrazo(prazo, concluida) {
  if (!prazo) {
    return { texto: 'Sem prazo', classe: 'neutro', atrasada: false };
  }

  const hoje = dataLocalISO();
  const data = String(prazo).slice(0, 10);
  const dataFormatada = formatarData(data);

  if (concluida) {
    return { texto: dataFormatada, classe: 'concluido', atrasada: false };
  }

  if (data < hoje) {
    return { texto: `Atrasada · ${dataFormatada}`, classe: 'atrasado', atrasada: true };
  }

  if (data === hoje) {
    return { texto: `Hoje · ${dataFormatada}`, classe: 'hoje', atrasada: false };
  }

  return { texto: dataFormatada, classe: 'futuro', atrasada: false };
}

export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
