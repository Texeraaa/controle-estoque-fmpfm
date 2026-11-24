import type { ReactNode } from 'react';
import { Marca } from './Marca';

export type Aba = 'produtos' | 'historico' | 'backup';

const ABAS: { id: Aba; rotulo: string; icone: ReactNode }[] = [
  {
    id: 'produtos',
    rotulo: 'Produtos',
    icone: (
      <>
        <path d="M12 3 20 7v10l-8 4-8-4V7z" />
        <path d="M4 7l8 4 8-4M12 11v10" />
      </>
    ),
  },
  {
    id: 'historico',
    rotulo: 'Histórico',
    icone: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    id: 'backup',
    rotulo: 'Backup',
    icone: (
      <>
        <path d="M12 4v11M7 10l5 5 5-5" />
        <path d="M4 20h16" />
      </>
    ),
  },
];

function Icone({ children }: { children: ReactNode }) {
  return (
    <svg
      className="menu-icone"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Barra de abas no rodapé em telas estreitas; menu lateral recolhível no computador. */
export function Abas({
  ativa,
  aoMudar,
  recolhido,
  aoAlternar,
}: {
  ativa: Aba;
  aoMudar: (a: Aba) => void;
  recolhido: boolean;
  aoAlternar: () => void;
}) {
  return (
    <aside className="menu">
      <Marca />
      <nav className="abas" aria-label="Seções">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            className="abas-botao"
            aria-current={a.id === ativa ? 'page' : undefined}
            title={recolhido ? a.rotulo : undefined}
            onClick={() => aoMudar(a.id)}
          >
            <Icone>{a.icone}</Icone>
            <span className="menu-rotulo">{a.rotulo}</span>
          </button>
        ))}
      </nav>
      <button
        type="button"
        className="menu-recolher"
        aria-expanded={!recolhido}
        title={recolhido ? 'Expandir menu' : undefined}
        onClick={aoAlternar}
      >
        <Icone>
          <path d={recolhido ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
        </Icone>
        <span className="menu-rotulo">{recolhido ? 'Expandir menu' : 'Recolher menu'}</span>
      </button>
    </aside>
  );
}
