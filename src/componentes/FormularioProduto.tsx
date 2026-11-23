import { useId, useState, type FormEvent } from 'react';
import {
  categorias,
  contarMovimentacoes,
  criarProduto,
  editarProduto,
  excluirProduto,
  type ErrosProduto,
} from '../dominio/estoque';
import { formatarQuantidade, numeroParaTexto, parsePreco, parseQuantidade } from '../dominio/numeros';
import { MAX_NOME, UNIDADES, type Dados, type Produto, type Unidade } from '../dominio/tipos';
import { useDialogo } from './useDialogo';

interface Props {
  dados: Dados;
  produto: Produto | null;
  aoAplicar: (novos: Dados) => boolean;
  aoFechar: () => void;
}

const MSG_INVALIDO = 'Informe um valor válido.';
const MSG_INTEIRO_UN = 'Para unidade "un", use números inteiros.';

/** Vazio vale zero; texto recusado vira null junto com a mensagem do campo. */
function lerQuantidade(texto: string, unidade: Unidade): { mil: number; erro?: string } {
  if (texto.trim() === '') return { mil: 0 };
  const mil = parseQuantidade(texto, unidade);
  if (mil !== null) return { mil };
  const decimalEmUn = unidade === 'un' && parseQuantidade(texto, 'kg') !== null;
  return { mil: 0, erro: decimalEmUn ? MSG_INTEIRO_UN : MSG_INVALIDO };
}

export function FormularioProduto({ dados, produto, aoAplicar, aoFechar }: Props) {
  const ref = useDialogo(aoFechar);
  const id = useId();
  const edicao = produto !== null;
  const [nome, setNome] = useState(produto?.nome ?? '');
  const [categoria, setCategoria] = useState(produto?.categoria ?? '');
  const [preco, setPreco] = useState(produto ? numeroParaTexto(produto.precoCentavos, 2) : '');
  const [unidade, setUnidade] = useState<Unidade>(produto?.unidade ?? 'un');
  const [quantidade, setQuantidade] = useState(produto ? numeroParaTexto(produto.quantidadeMil, 3) : '');
  const [minimo, setMinimo] = useState(produto ? numeroParaTexto(produto.estoqueMinimoMil, 3) : '');
  const [erros, setErros] = useState<ErrosProduto>({});

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    const erroPreco = preco.trim() !== '' && parsePreco(preco) === null ? MSG_INVALIDO : undefined;
    const centavos = preco.trim() === '' ? 0 : (parsePreco(preco) ?? 0);
    const min = lerQuantidade(minimo, unidade);
    const qtd = edicao ? { mil: 0, erro: undefined } : lerQuantidade(quantidade, unidade);

    const r =
      produto === null
        ? criarProduto(dados, {
            nome,
            categoria,
            precoCentavos: centavos,
            unidade,
            quantidadeMil: qtd.mil,
            estoqueMinimoMil: min.mil,
          })
        : editarProduto(dados, produto.id, {
            nome,
            categoria,
            precoCentavos: centavos,
            estoqueMinimoMil: min.mil,
          });

    const doDominio: ErrosProduto = r.ok ? {} : r.erro;
    const todos: ErrosProduto = { ...doDominio };
    if (erroPreco) todos.preco = erroPreco;
    if (qtd.erro) todos.quantidade = qtd.erro;
    if (min.erro) todos.estoqueMinimo = min.erro;

    if (Object.keys(todos).length > 0 || !r.ok) {
      setErros(todos);
      return;
    }
    if (aoAplicar(r.valor)) aoFechar();
  };

  const excluir = () => {
    if (!produto) return;
    const n = contarMovimentacoes(dados, produto.id);
    if (window.confirm(`Excluir "${produto.nome}"? ${n === 1 ? '1 movimentação também será apagada.' : `${n} movimentações também serão apagadas.`}`)) {
      if (aoAplicar(excluirProduto(dados, produto.id))) aoFechar();
    }
  };

  const erro = (campo: keyof ErrosProduto) =>
    erros[campo] ? (
      <p className="campo-erro" id={`${id}-${campo}-erro`}>
        {erros[campo]}
      </p>
    ) : null;
  const ligacao = (campo: keyof ErrosProduto) =>
    erros[campo] ? { 'aria-describedby': `${id}-${campo}-erro`, 'aria-invalid': true as const } : {};

  return (
    <dialog ref={ref} className="dialogo" aria-labelledby={`${id}-titulo`}>
      <form className="dialogo-corpo" onSubmit={salvar} noValidate>
        <h2 id={`${id}-titulo`} className="dialogo-titulo">
          {edicao ? 'Editar produto' : 'Novo produto'}
        </h2>

        <div className="campo">
          <label htmlFor={`${id}-nome`}>Nome</label>
          <input
            id={`${id}-nome`}
            value={nome}
            maxLength={MAX_NOME}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="off"
            enterKeyHint="next"
            {...ligacao('nome')}
          />
          {erro('nome')}
        </div>

        <div className="campo">
          <label htmlFor={`${id}-categoria`}>Categoria</label>
          <input
            id={`${id}-categoria`}
            value={categoria}
            list={`${id}-categorias`}
            onChange={(e) => setCategoria(e.target.value)}
            autoComplete="off"
            enterKeyHint="next"
          />
          <datalist id={`${id}-categorias`}>
            {categorias(dados).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="campo">
          <label htmlFor={`${id}-preco`}>Preço (R$)</label>
          <input
            id={`${id}-preco`}
            value={preco}
            inputMode="decimal"
            onChange={(e) => setPreco(e.target.value)}
            autoComplete="off"
            {...ligacao('preco')}
          />
          {erro('preco')}
        </div>

        <div className="campo">
          <label htmlFor={`${id}-unidade`}>Unidade</label>
          <select
            id={`${id}-unidade`}
            value={unidade}
            disabled={edicao}
            onChange={(e) => setUnidade(e.target.value as Unidade)}
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor={`${id}-quantidade`}>Quantidade inicial</label>
          <input
            id={`${id}-quantidade`}
            value={edicao ? formatarQuantidade(produto.quantidadeMil, produto.unidade) : quantidade}
            inputMode="decimal"
            readOnly={edicao}
            onChange={(e) => setQuantidade(e.target.value)}
            autoComplete="off"
            aria-describedby={edicao ? `${id}-dica` : erros.quantidade ? `${id}-quantidade-erro` : undefined}
            aria-invalid={erros.quantidade ? true : undefined}
          />
          {edicao && (
            <p className="campo-dica" id={`${id}-dica`}>
              Para alterar a quantidade, registre uma entrada ou saída.
            </p>
          )}
          {erros.quantidade && (
            <p className="campo-erro" id={`${id}-quantidade-erro`}>
              {erros.quantidade}
            </p>
          )}
        </div>

        <div className="campo">
          <label htmlFor={`${id}-minimo`}>Estoque mínimo</label>
          <input
            id={`${id}-minimo`}
            value={minimo}
            inputMode="decimal"
            onChange={(e) => setMinimo(e.target.value)}
            autoComplete="off"
            {...ligacao('estoqueMinimo')}
          />
          {erro('estoqueMinimo')}
        </div>

        <div className="dialogo-acoes">
          <button type="submit" className="botao botao-primario">
            Salvar
          </button>
          <button type="button" className="botao" onClick={aoFechar}>
            Cancelar
          </button>
          {edicao && (
            <button type="button" className="botao botao-perigo" onClick={excluir}>
              Excluir produto
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
