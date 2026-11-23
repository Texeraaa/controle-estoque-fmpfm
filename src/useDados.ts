import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAVE, carregar, salvar } from './armazenamento/local';
import { dadosVazios } from './dominio/estoque';
import type { Dados } from './dominio/tipos';

interface Carga {
  dados: Dados;
  erroCarga: string | null;
}

function ler(): Carga {
  const r = carregar();
  return r.ok ? { dados: r.dados, erroCarga: null } : { dados: dadosVazios(), erroCarga: r.bruto };
}

export function useDados() {
  const [carga, setCarga] = useState<Carga>(ler);
  const [erroGravacao, setErroGravacao] = useState(false);
  const bloqueado = useRef(carga.erroCarga !== null);
  bloqueado.current = carga.erroCarga !== null;

  const aplicar = useCallback((novos: Dados): boolean => {
    // Conteúdo ilegível nunca é sobrescrito antes de o usuário decidir.
    if (bloqueado.current) return false;
    if (!salvar(novos)) {
      setErroGravacao(true);
      return false;
    }
    setErroGravacao(false);
    setCarga({ dados: novos, erroCarga: null });
    return true;
  }, []);

  const descartarCorrompido = useCallback(() => {
    bloqueado.current = false;
    setCarga({ dados: dadosVazios(), erroCarga: null });
  }, []);

  useEffect(() => {
    const aoMudar = (e: StorageEvent) => {
      if (e.key === CHAVE) setCarga(ler());
    };
    window.addEventListener('storage', aoMudar);
    return () => window.removeEventListener('storage', aoMudar);
  }, []);

  return {
    dados: carga.dados,
    aplicar,
    erroCarga: carga.erroCarga,
    erroGravacao,
    descartarCorrompido,
  };
}
