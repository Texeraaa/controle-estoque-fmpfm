import { useState } from 'react';
import { filtrarMovimentacoes } from '../dominio/estoque';
import { formatarDataHora, formatarQuantidade } from '../dominio/numeros';
import type { Dados } from '../dominio/tipos';

const POR_PAGINA = 50;

type FiltroTipo = '' | 'entrada' | 'saida';

export function Historico({ dados }: { dados: Dados }) {
  const [produtoId, setProdutoId] = useState('');
  const [tipo, setTipo] = useState<FiltroTipo>('');
  const [limite, setLimite] = useState(POR_PAGINA);

  const produtos = [...dados.produtos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const todas = filtrarMovimentacoes(dados, { produtoId: produtoId || undefined, tipo: tipo || undefined });
  const visiveis = todas.slice(0, limite);

  return (
    <section className="historico">
      <h2>Histórico</h2>
      <div className="historico-filtros">
        <div className="campo">
          <label htmlFor="historico-produto">Produto</label>
          <select
            id="historico-produto"
            value={produtoId}
            onChange={(e) => {
              setProdutoId(e.target.value);
              setLimite(POR_PAGINA);
            }}
          >
            <option value="">Todos os produtos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="historico-tipo">Tipo</label>
          <select
            id="historico-tipo"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as FiltroTipo);
              setLimite(POR_PAGINA);
            }}
          >
            <option value="">Todas</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </div>
      </div>

      {todas.length === 0 ? (
        <p className="historico-vazio">Nenhuma movimentação registrada</p>
      ) : (
        <ul className="historico-lista">
          {visiveis.map((m) => {
            const produto = dados.produtos.find((p) => p.id === m.produtoId);
            const unidade = produto?.unidade ?? 'un';
            const entrada = m.tipo === 'entrada';
            return (
              <li key={m.id} className="historico-item">
                <div className="historico-topo">
                  <span className={`historico-tipo ${entrada ? 'historico-entrada' : 'historico-saida'}`}>
                    {entrada ? 'Entrada' : 'Saída'}
                  </span>
                  <span className="historico-produto">{produto?.nome ?? ''}</span>
                  <span className="historico-qtd">
                    {entrada ? '+' : '−'}
                    {formatarQuantidade(m.quantidadeMil, unidade)}
                  </span>
                </div>
                {m.motivo && <div className="historico-detalhe">{m.motivo}</div>}
                {m.observacao && <div className="historico-detalhe">{m.observacao}</div>}
                <div className="historico-rodape">
                  <span>{formatarDataHora(m.criadaEm)}</span>
                  <span>Saldo: {formatarQuantidade(m.saldoAposMil, unidade)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {todas.length > limite && (
        <button type="button" className="botao" onClick={() => setLimite((l) => l + POR_PAGINA)}>
          Mostrar mais
        </button>
      )}
    </section>
  );
}
