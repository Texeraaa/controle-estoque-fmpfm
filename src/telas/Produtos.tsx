import { useState } from 'react';
import { emAlerta, filtrarProdutos, resumo } from '../dominio/estoque';
import { formatarPreco, formatarQuantidade } from '../dominio/numeros';
import type { Dados, Produto } from '../dominio/tipos';

interface Props {
  dados: Dados;
  aoNovo: () => void;
  aoEditar: (p: Produto) => void;
  aoMovimentar: (p: Produto, tipo: 'entrada' | 'saida') => void;
}

export function Produtos({ dados, aoNovo, aoEditar, aoMovimentar }: Props) {
  const [busca, setBusca] = useState('');
  const [soBaixo, setSoBaixo] = useState(false);
  const r = resumo(dados);
  const visiveis = filtrarProdutos(dados.produtos, busca, soBaixo);
  const vazio = dados.produtos.length === 0;

  return (
    <section className="produtos">
      <div className="produtos-resumo">
        <div className="produtos-bloco">
          {r.totalProdutos} {r.totalProdutos === 1 ? 'produto' : 'produtos'}
        </div>
        <button
          type="button"
          className="produtos-bloco produtos-bloco-alerta"
          aria-pressed={soBaixo}
          onClick={() => setSoBaixo(true)}
        >
          {r.emAlerta} em alerta
        </button>
        <div className="produtos-bloco">{formatarPreco(r.valorCentavos)} em estoque</div>
      </div>

      <input
        type="search"
        className="produtos-busca"
        aria-label="Buscar produto"
        placeholder="Buscar produto…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        autoComplete="off"
        autoCapitalize="none"
        enterKeyHint="search"
      />

      <div className="produtos-filtros">
        <button type="button" className="produtos-filtro" aria-pressed={!soBaixo} onClick={() => setSoBaixo(false)}>
          Todos
        </button>
        <button
          type="button"
          className="produtos-filtro produtos-filtro-alerta"
          aria-pressed={soBaixo}
          onClick={() => setSoBaixo(true)}
        >
          Estoque baixo ({r.emAlerta})
        </button>
      </div>

      {visiveis.length === 0 ? (
        <p className="produtos-vazio">{vazio ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}</p>
      ) : (
        <ul className="produtos-lista">
          {visiveis.map((p) => {
            const baixo = emAlerta(p);
            const preco = formatarPreco(p.precoCentavos) + (p.unidade === 'un' ? '' : `/${p.unidade}`);
            return (
              <li key={p.id} className={baixo ? 'produtos-linha produtos-linha-baixo' : 'produtos-linha'}>
                <div className="produtos-info">
                  <div className="produtos-titulo">
                    <button type="button" className="produtos-nome" onClick={() => aoEditar(p)}>
                      {p.nome}
                    </button>
                    {baixo && <span className="produtos-etiqueta">baixo</span>}
                  </div>
                  <div className="produtos-meta">{p.categoria ? `${p.categoria} · ${preco}` : preco}</div>
                </div>
                <div className="produtos-qtd">
                  <span className="produtos-saldo">{formatarQuantidade(p.quantidadeMil, p.unidade)}</span>
                  <span className="produtos-minimo">mín. {formatarQuantidade(p.estoqueMinimoMil, p.unidade)}</span>
                </div>
                <div className="produtos-acoes">
                  <button
                    type="button"
                    className="produtos-mov"
                    aria-label={`Registrar saída de ${p.nome}`}
                    disabled={p.quantidadeMil === 0}
                    onClick={() => aoMovimentar(p, 'saida')}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="produtos-mov"
                    aria-label={`Registrar entrada de ${p.nome}`}
                    onClick={() => aoMovimentar(p, 'entrada')}
                  >
                    +
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="produtos-novo-area">
        <button type="button" className={vazio ? 'produtos-novo produtos-novo-destaque' : 'produtos-novo'} onClick={aoNovo}>
          Novo produto
        </button>
      </div>
    </section>
  );
}
