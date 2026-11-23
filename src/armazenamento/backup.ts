import {
  MAX_NOME,
  MAX_PRECO_CENTAVOS,
  MAX_QUANTIDADE_MIL,
  UNIDADES,
  type Dados,
  type MotivoSaida,
  type Movimentacao,
  type Produto,
  type Resultado,
  type Unidade,
} from '../dominio/tipos';

const ERRO_ARQUIVO = 'Arquivo de backup inválido.';
const MOTIVOS: MotivoSaida[] = ['venda', 'perda', 'ajuste'];

class Invalido extends Error {}

function exigir(condicao: boolean): asserts condicao {
  if (!condicao) throw new Invalido();
}

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function ehTexto(v: unknown): v is string {
  return typeof v === 'string';
}

function ehIdValido(v: unknown): v is string {
  return typeof v === 'string' && v !== '';
}

function ehData(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v));
}

function ehInteiro(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
}

function lerProduto(bruto: unknown): Produto {
  exigir(ehObjeto(bruto));
  const { id, nome, categoria, precoCentavos, unidade, quantidadeMil, estoqueMinimoMil, criadoEm, atualizadoEm } = bruto;
  exigir(ehIdValido(id));
  exigir(ehTexto(nome) && nome.trim() !== '' && nome.trim().length <= MAX_NOME);
  exigir(ehTexto(categoria));
  exigir(ehInteiro(precoCentavos, 0, MAX_PRECO_CENTAVOS));
  exigir(ehTexto(unidade) && (UNIDADES as string[]).includes(unidade));
  exigir(ehInteiro(quantidadeMil, 0, MAX_QUANTIDADE_MIL));
  exigir(ehInteiro(estoqueMinimoMil, 0, MAX_QUANTIDADE_MIL));
  if (unidade === 'un') exigir(quantidadeMil % 1000 === 0 && estoqueMinimoMil % 1000 === 0);
  exigir(ehData(criadoEm) && ehData(atualizadoEm));
  return {
    id,
    nome,
    categoria,
    precoCentavos,
    unidade: unidade as Unidade,
    quantidadeMil,
    estoqueMinimoMil,
    criadoEm,
    atualizadoEm,
  };
}

function lerMovimentacao(bruto: unknown): Movimentacao {
  exigir(ehObjeto(bruto));
  const { id, produtoId, tipo, quantidadeMil, motivo, observacao, saldoAposMil, criadaEm } = bruto;
  exigir(ehIdValido(id) && ehIdValido(produtoId));
  exigir(tipo === 'entrada' || tipo === 'saida');
  exigir(ehInteiro(quantidadeMil, 1, MAX_QUANTIDADE_MIL));
  exigir(ehInteiro(saldoAposMil, 0, MAX_QUANTIDADE_MIL));
  exigir(ehData(criadaEm));
  const mov: Movimentacao = { id, produtoId, tipo, quantidadeMil, saldoAposMil, criadaEm };
  if (motivo !== undefined) {
    exigir(tipo === 'saida' && ehTexto(motivo) && (MOTIVOS as string[]).includes(motivo));
    mov.motivo = motivo as MotivoSaida;
  }
  if (observacao !== undefined) {
    exigir(ehTexto(observacao));
    mov.observacao = observacao;
  }
  return mov;
}

function lerLista<T>(bruto: unknown, ler: (item: unknown) => T): T[] {
  exigir(Array.isArray(bruto));
  return bruto.map((item) => ler(item));
}

function exigirUnicos(valores: string[]): void {
  exigir(new Set(valores).size === valores.length);
}

/** Valida estritamente e devolve uma cópia nova só com os campos conhecidos. Nunca lança. */
export function validarDados(valor: unknown): Resultado<Dados> {
  try {
    exigir(ehObjeto(valor));
    exigir(valor.versao === 1);
    const produtos = lerLista(valor.produtos, lerProduto);
    const movimentacoes = lerLista(valor.movimentacoes, lerMovimentacao);
    const dados: Dados = { versao: 1, produtos, movimentacoes };
    if (valor.ultimoBackupEm !== undefined) {
      exigir(ehData(valor.ultimoBackupEm));
      dados.ultimoBackupEm = valor.ultimoBackupEm;
    }

    exigirUnicos(produtos.map((p) => p.id));
    exigirUnicos(movimentacoes.map((m) => m.id));
    exigirUnicos(produtos.map((p) => p.nome.trim().toLowerCase()));
    const ids = new Set(produtos.map((p) => p.id));
    exigir(movimentacoes.every((m) => ids.has(m.produtoId)));
    const unidades = new Map(produtos.map((p) => [p.id, p.unidade]));
    exigir(movimentacoes.every((m) => unidades.get(m.produtoId) !== 'un' || (m.quantidadeMil % 1000 === 0 && m.saldoAposMil % 1000 === 0)));

    const saldos = new Map<string, number>();
    for (const m of movimentacoes) {
      saldos.set(m.produtoId, (saldos.get(m.produtoId) ?? 0) + (m.tipo === 'entrada' ? m.quantidadeMil : -m.quantidadeMil));
    }
    for (const p of produtos) {
      if ((saldos.get(p.id) ?? 0) !== p.quantidadeMil) {
        return { ok: false, erro: `Backup inconsistente: o saldo de "${p.nome}" não confere com o histórico.` };
      }
    }
    return { ok: true, valor: dados };
  } catch {
    return { ok: false, erro: ERRO_ARQUIVO };
  }
}

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

/** AAAA-MM-DD na data local de um instante ISO. */
export function dataLocal(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

export function gerarBackup(
  dados: Dados,
  agora: string = new Date().toISOString(),
): { nomeArquivo: string; conteudo: string; dados: Dados } {
  const comData: Dados = { ...dados, ultimoBackupEm: agora };
  return {
    nomeArquivo: `estoque-backup-${dataLocal(agora)}.json`,
    conteudo: JSON.stringify(comData, null, 2),
    dados: comData,
  };
}

export function lerBackup(texto: string): Resultado<Dados> {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, erro: ERRO_ARQUIVO };
  }
  return validarDados(bruto);
}
