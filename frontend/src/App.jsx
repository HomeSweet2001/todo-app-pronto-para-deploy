import { useEffect, useState } from 'react';
import Login from './components/Login.jsx';
import Painel from './Painel.jsx';
import { EVENTO_SESSAO_EXPIRADA, sair, temSessao } from './services/api.js';

/**
 * Porta de entrada: sem sessão ativa, a primeira tela é sempre o login.
 */
export default function App() {
  const [autenticado, setAutenticado] = useState(() => temSessao());
  const [aviso, setAviso] = useState('');

  // A API respondeu 401 (token expirado ou inválido): volta para o login
  useEffect(() => {
    function aoExpirar() {
      setAviso('Sua sessão expirou. Faça login novamente.');
      setAutenticado(false);
    }

    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  function aoEntrar() {
    setAviso('');
    setAutenticado(true);
  }

  function aoSair() {
    sair();
    setAviso('');
    setAutenticado(false);
  }

  if (!autenticado) {
    return <Login aoEntrar={aoEntrar} aviso={aviso} />;
  }

  return <Painel aoSair={aoSair} />;
}
