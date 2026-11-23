import { useEffect, useRef } from 'react';

/** Abre o <dialog> como modal ao montar (Esc fecha) e devolve o foco a quem o abriu ao desmontar. */
export function useDialogo(aoFechar: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const fechar = useRef(aoFechar);
  fechar.current = aoFechar;

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    const anterior = document.activeElement as HTMLElement | null;
    const aoEncerrar = () => fechar.current();
    dialogo.addEventListener('close', aoEncerrar);
    dialogo.showModal();
    // React não repassa autofocus ao DOM; o campo marcado recebe o foco depois de abrir.
    dialogo.querySelector<HTMLElement>('[data-foco]')?.focus();
    return () => {
      dialogo.removeEventListener('close', aoEncerrar);
      if (anterior && anterior.isConnected) anterior.focus();
    };
  }, []);

  return ref;
}
