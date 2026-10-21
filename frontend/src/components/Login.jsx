import { useState } from 'react';
import { entrar } from '../services/api.js';

export default function Login({ aoEntrar, aviso = '' }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;

    if (!usuario.trim() || !senha) {
      setErro('Informe o usuário e a senha.');
      return;
    }

    setEnviando(true);
    setErro('');

    try {
      await entrar(usuario.trim(), senha);
      aoEntrar();
    } catch (falha) {
      setErro(falha.message || 'Não foi possível entrar. Tente novamente.');
      setEnviando(false);
    }
  }

  return (
    <main className="tela-login">
      <section className="cartao-login" aria-labelledby="titulo-login">
        <span className="logotipo" aria-hidden="true">
          ✓
        </span>
        <h1 id="titulo-login">Minha Lista de Tarefas</h1>
        <p className="descricao-login">Entre para acessar as suas tarefas.</p>

        <form className="formulario-login" onSubmit={enviar} noValidate>
          {(erro || aviso) && (
            <div className="mensagem-erro" role="alert">
              {erro || aviso}
            </div>
          )}

          <div className="campo">
            <label htmlFor="login-usuario">Usuário</label>
            <input
              id="login-usuario"
              type="text"
              value={usuario}
              onChange={(evento) => setUsuario(evento.target.value)}
              autoComplete="username"
              autoFocus
              disabled={enviando}
            />
          </div>

          <div className="campo">
            <label htmlFor="login-senha">Senha</label>
            <input
              id="login-senha"
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              autoComplete="current-password"
              disabled={enviando}
            />
          </div>

          <button type="submit" className="botao botao-primario botao-login" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
