import { formatarQuantidade } from './numeros';
import {
  MAX_NOME,
  MAX_PRECO_CENTAVOS,
  MAX_QUANTIDADE_MIL,
  type Dados,
  type MotivoSaida,
  type Movimentacao,
  type Produto,
  type Resultado,
  type Unidade,
} from './tipos';

export interface EntradaProduto {
  nome: string;
  categoria: string;
  precoCentavos: number;
  unidade: Unidade;
  quantidadeMil: number;
  estoqueMinimoMil: number;
}
export type AlteracaoProduto = Pick<
  EntradaProduto,
  'nome' | 'categoria' | 'precoCentavos' | 'estoqueMinimoMil'
>;
export type ErrosProduto = Partial<
  Record<'nome' | 'preco' | 'quantidade' | 'estoqueMinimo', string>
>;

const MSG_INVALIDO = 'Informe um valor válido.';
const MSG_ALTO = 'Valor muito alto.';
const MSG_INTEIRO_UN = 'Para unidade "un", use números inteiros.';
const MSG_QUANTIDADE = 'Informe uma quantidade maior que zero.';
const MSG_NAO_ENCONTRADO = 'Produto não encontrado.';

export function dadosVazios(): Dados {
  return { versao: 1, produtos: [], movimentacoes: [] };
}

const ehInteiroNaoNegativo = (n: number) => Number.isInteger(n) && n >= 0;

function validarQuantidadeMil(n: number, unidade: Unidade): string | undefined {
  if (!ehInteiroNaoNegativo(n)) return MSG_INVALIDO;
  if (unidade === 'un' && n % 1000 !== 0) return MSG_INTEIRO_UN;
  if (n > MAX_QUANTIDADE_MIL) return MSG_ALTO;
  return undefined;
}

function validarPreco(n: number): string | undefined {
  if (!ehInteiroNaoNegativo(n)) return MSG_INVALIDO;
  if (n > MAX_PRECO_CENTAVOS) return MSG_ALTO;
  return undefined;
}

function validarNome(nome: string, produtos: Produto[], ignorarId?: string): string | undefined {
  const aparado = nome.trim();
  if (aparado === '') return 'Informe o nome do produto.';
  if (aparado.length > MAX_NOME) return `O nome pode ter no máximo ${MAX_NOME} caracteres.`;
  const chave = aparado.toLowerCase();
  if (produtos.some((p) => p.id !== ignorarId && p.nome.trim().toLowerCase() === chave)) {
    return 'Já existe um produto com esse nome.';
  }
  return undefined;
}

function juntarErros(erros: ErrosProduto): ErrosProduto | null {
  const limpos = Object.fromEntries(Object.entries(erros).filter(([, v]) => v !== undefined));
  return Object.keys(limpos).length > 0 ? (limpos as ErrosProduto) : null;
}

function observacaoOuUndefined(observacao?: string): string | undefined {
  const t = observacao?.trim();
  return t ? t : undefined;
}

export function criarProduto(
  dados: Dados,
  entrada: EntradaProduto,
  agora: string = new Date().toISOString(),
): Resultado<Dados, ErrosProduto> {
  const erros = juntarErros({
    nome: validarNome(entrada.nome, dados.produtos),
    preco: validarPreco(entrada.precoCentavos),
    quantidade: validarQuantidadeMil(entrada.quantidadeMil, entrada.unidade),
    estoqueMinimo: validarQuantidadeMil(entrada.estoqueMinimoMil, entrada.unidade),
  });
  if (erros) return { ok: false, erro: erros };

  const produto: Produto = {
    id: crypto.randomUUID(),
    nome: entrada.nome.trim(),
    categoria: entrada.categoria.trim(),
    precoCentavos: entrada.precoCentavos,
    unidade: entrada.unidade,
    quantidadeMil: entrada.quantidadeMil,
    estoqueMinimoMil: entrada.estoqueMinimoMil,
    criadoEm: agora,
    atualizadoEm: agora,
  };
  const movimentacoes = [...dados.movimentacoes];
  if (produto.quantidadeMil > 0) {
    movimentacoes.push({
      id: crypto.randomUUID(),
      produtoId: produto.id,
      tipo: 'entrada',
      quantidadeMil: produto.quantidadeMil,
      observacao: 'Estoque inicial',
      saldoAposMil: produto.quantidadeMil,
      criadaEm: agora,
    });
  }
  return { ok: true, valor: { ...dados, produtos: [...dados.produtos, produto], movimentacoes } };
}

export function editarProduto(
  dados: Dados,
  id: string,
  alt: AlteracaoProduto,
  agora: string = new Date().toISOString(),
): Resultado<Dados, ErrosProduto> {
  const atual = dados.produtos.find((p) => p.id === id);
  if (!atual) return { ok: false, erro: { nome: MSG_NAO_ENCONTRADO } };
  const erros = juntarErros({
    nome: validarNome(alt.nome, dados.produtos, id),
    preco: validarPreco(alt.precoCentavos),
    estoqueMinimo: validarQuantidadeMil(alt.estoqueMinimoMil, atual.unidade),
  });
  if (erros) return { ok: false, erro: erros };

  const novo: Produto = {
    ...atual,
    nome: alt.nome.trim(),
    categoria: alt.categoria.trim(),
    precoCentavos: alt.precoCentavos,
    estoqueMinimoMil: alt.estoqueMinimoMil,
    atualizadoEm: agora,
  };
  return { ok: true, valor: { ...dados, produtos: dados.produtos.map((p) => (p.id === id ? novo : p)) } };
}

export function excluirProduto(dados: Dados, id: string): Dados {
  return {
    ...dados,
    produtos: dados.produtos.filter((p) => p.id !== id),
    movimentacoes: dados.movimentacoes.filter((m) => m.produtoId !== id),
  };
}

export function contarMovimentacoes(dados: Dados, produtoId: string): number {
  return dados.movimentacoes.filter((m) => m.produtoId === produtoId).length;
}

function movimentar(
  dados: Dados,
  produtoId: string,
  tipo: 'entrada' | 'saida',
  quantidadeMil: number,
  motivo: MotivoSaida | undefined,
  observacao: string | undefined,
  agora: string,
): Resultado<Dados> {
  const produto = dados.produtos.find((p) => p.id === produtoId);
  if (!produto) return { ok: false, erro: MSG_NAO_ENCONTRADO };
  if (!Number.isInteger(quantidadeMil) || quantidadeMil <= 0) return { ok: false, erro: MSG_QUANTIDADE };
  if (produto.unidade === 'un' && quantidadeMil % 1000 !== 0) return { ok: false, erro: MSG_INTEIRO_UN };

  const saldo = produto.quantidadeMil + (tipo === 'entrada' ? quantidadeMil : -quantidadeMil);
  if (tipo === 'saida' && saldo < 0) {
    return {
      ok: false,
      erro: `Saída maior que o saldo. Disponível: ${formatarQuantidade(produto.quantidadeMil, produto.unidade)}.`,
    };
  }
  if (saldo > MAX_QUANTIDADE_MIL) return { ok: false, erro: MSG_ALTO };

  const mov: Movimentacao = {
    id: crypto.randomUUID(),
    produtoId,
    tipo,
    quantidadeMil,
    saldoAposMil: saldo,
    criadaEm: agora,
  };
  if (motivo) mov.motivo = motivo;
  const obs = observacaoOuUndefined(observacao);
  if (obs) mov.observacao = obs;

  return {
    ok: true,
    valor: {
      ...dados,
      produtos: dados.produtos.map((p) =>
        p.id === produtoId ? { ...p, quantidadeMil: saldo, atualizadoEm: agora } : p,
      ),
      movimentacoes: [...dados.movimentacoes, mov],
    },
  };
}

export function registrarEntrada(
  dados: Dados,
  produtoId: string,
  quantidadeMil: number,
  observacao?: string,
  agora: string = new Date().toISOString(),
): Resultado<Dados> {
  return movimentar(dados, produtoId, 'entrada', quantidadeMil, undefined, observacao, agora);
}

export function registrarSaida(
  dados: Dados,
  produtoId: string,
  quantidadeMil: number,
  motivo: MotivoSaida,
  observacao?: string,
  agora: string = new Date().toISOString(),
): Resultado<Dados> {
  return movimentar(dados, produtoId, 'saida', quantidadeMil, motivo, observacao, agora);
}

export function emAlerta(p: Produto): boolean {
  return p.quantidadeMil <= p.estoqueMinimoMil;
}

export function valorEmEstoqueCentavos(p: Produto): number {
  return Math.round((p.precoCentavos * p.quantidadeMil) / 1000);
}

export function resumo(dados: Dados): { totalProdutos: number; emAlerta: number; valorCentavos: number } {
  return {
    totalProdutos: dados.produtos.length,
    emAlerta: dados.produtos.filter(emAlerta).length,
    valorCentavos: dados.produtos.reduce((soma, p) => soma + valorEmEstoqueCentavos(p), 0),
  };
}

export function categorias(dados: Dados): string[] {
  const distintas = new Set(dados.produtos.map((p) => p.categoria).filter((c) => c !== ''));
  return [...distintas].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function filtrarProdutos(produtos: Produto[], busca: string, soBaixo: boolean): Produto[] {
  const termo = semAcento(busca.trim());
  return produtos
    .filter((p) => !soBaixo || emAlerta(p))
    .filter((p) => termo === '' || semAcento(p.nome).includes(termo) || semAcento(p.categoria).includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function filtrarMovimentacoes(
  dados: Dados,
  filtro: { produtoId?: string; tipo?: 'entrada' | 'saida' },
): Movimentacao[] {
  return dados.movimentacoes
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => !filtro.produtoId || m.produtoId === filtro.produtoId)
    .filter(({ m }) => !filtro.tipo || m.tipo === filtro.tipo)
    .sort((a, b) => (a.m.criadaEm < b.m.criadaEm ? 1 : a.m.criadaEm > b.m.criadaEm ? -1 : b.i - a.i))
    .map(({ m }) => m);
}
