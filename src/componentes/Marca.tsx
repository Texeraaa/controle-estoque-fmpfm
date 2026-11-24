export const NOME_MARCA = 'Estoka';

/** Logo e nome do produto. Aparece no cabeçalho (celular) e no topo do menu lateral (computador). */
export function Marca() {
  return (
    <div className="marca">
      <svg className="marca-logo" viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#fca311" />
        <g fill="none" stroke="#14213d" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
          <path d="M20 9 30 13.5v12L20 31l-10-5.5v-12z" />
          <path d="M10 13.5 20 18.5l10-5M20 18.5V31" />
        </g>
      </svg>
      <span className="marca-nome">{NOME_MARCA}</span>
    </div>
  );
}
