export type Aba = 'produtos' | 'historico' | 'backup';

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'produtos', rotulo: 'Produtos' },
  { id: 'historico', rotulo: 'Histórico' },
  { id: 'backup', rotulo: 'Backup' },
];

export function Abas({ ativa, aoMudar }: { ativa: Aba; aoMudar: (a: Aba) => void }) {
  return (
    <nav className="abas" aria-label="Seções">
      {ABAS.map((a) => (
        <button
          key={a.id}
          type="button"
          className="abas-botao"
          aria-current={a.id === ativa ? 'page' : undefined}
          onClick={() => aoMudar(a.id)}
        >
          {a.rotulo}
        </button>
      ))}
    </nav>
  );
}
