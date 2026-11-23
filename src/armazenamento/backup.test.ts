import { describe, expect, it } from 'vitest';
import { criarProduto, dadosVazios, registrarEntrada, registrarSaida } from '../dominio/estoque';
import type { Dados, Resultado } from '../dominio/tipos';
import { gerarBackup, lerBackup, validarDados } from './backup';

const AGORA = '2026-11-23T15:00:00.000Z';
const ERRO_ARQUIVO = 'Arquivo de backup inválido.';

function ok<T, E>(r: Resultado<T, E>): T {
  if (!r.ok) throw new Error('esperava ok: ' + JSON.stringify(r.erro));
  return r.valor;
}

function exemplo(): Dados {
  let d = ok(
    criarProduto(
      dadosVazios(),
      { nome: 'Arroz 5 kg', categoria: 'Mercearia', precoCentavos: 2890, unidade: 'un', quantidadeMil: 10_000, estoqueMinimoMil: 5000 },
      '2026-11-20T10:00:00.000Z',
    ),
  );
  d = ok(
    criarProduto(
      d,
      { nome: 'Queijo minas', categoria: 'Frios', precoCentavos: 4200, unidade: 'kg', quantidadeMil: 2300, estoqueMinimoMil: 1000 },
      '2026-11-20T10:01:00.000Z',
    ),
  );
  d = ok(registrarSaida(d, d.produtos[0].id, 8000, 'venda', 'balcão', '2026-11-21T10:00:00.000Z'));
  d = ok(registrarEntrada(d, d.produtos[1].id, 500, undefined, '2026-11-21T11:00:00.000Z'));
  d = ok(registrarSaida(d, d.produtos[1].id, 2000, 'perda', undefined, '2026-11-22T11:00:00.000Z'));
  return d;
}

function clone(d: Dados): any {
  return JSON.parse(JSON.stringify(d));
}

describe('gerarBackup / lerBackup', () => {
  it('exporta e lê de volta, com ultimoBackupEm = agora', () => {
    const d = exemplo();
    const b = gerarBackup(d, AGORA);
    expect(b.dados).toEqual({ ...d, ultimoBackupEm: AGORA });
    const lido = lerBackup(b.conteudo);
    expect(ok(lido)).toEqual({ ...d, ultimoBackupEm: AGORA });
  });

  it('não altera os dados de entrada', () => {
    const d = exemplo();
    gerarBackup(d, AGORA);
    expect(d.ultimoBackupEm).toBeUndefined();
  });

  it('conteúdo é JSON indentado com 2 espaços', () => {
    const b = gerarBackup(exemplo(), AGORA);
    expect(b.conteudo).toBe(JSON.stringify(b.dados, null, 2));
    expect(b.conteudo).toContain('\n  "versao": 1');
  });

  it('nome do arquivo usa a data local de agora', () => {
    const nome = gerarBackup(dadosVazios(), AGORA).nomeArquivo;
    expect(nome).toMatch(/^estoque-backup-2026-11-2\d\.json$/);
    const d = new Date(AGORA);
    const p = (n: number) => String(n).padStart(2, '0');
    expect(nome).toBe(`estoque-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`);
  });

  it('data local, não UTC, define o nome (meia-noite local)', () => {
    const local = new Date(2026, 0, 5, 0, 30);
    expect(gerarBackup(dadosVazios(), local.toISOString()).nomeArquivo).toBe('estoque-backup-2026-01-05.json');
  });

  it.each([
    ['texto que não é JSON', 'não é json'],
    ['versão 2', '{"versao":2}'],
    ['array', '[]'],
    ['CSV', 'Nome;Categoria'],
    ['null', 'null'],
    ['vazio', ''],
  ])('recusa %s', (_n, texto) => {
    const r = lerBackup(texto);
    expect(r).toEqual({ ok: false, erro: ERRO_ARQUIVO });
  });
});

describe('validarDados', () => {
  it('aceita dados vazios', () => {
    expect(ok(validarDados(dadosVazios()))).toEqual(dadosVazios());
  });

  it('devolve objeto novo, não a referência recebida', () => {
    const d = exemplo();
    const v = ok(validarDados(d));
    expect(v).toEqual(d);
    expect(v).not.toBe(d);
    expect(v.produtos[0]).not.toBe(d.produtos[0]);
    expect(v.movimentacoes[0]).not.toBe(d.movimentacoes[0]);
  });

  it('descarta campos desconhecidos em todos os níveis', () => {
    const original = exemplo();
    const d = clone(original);
    d.extra = 1;
    d.produtos[0].segredo = 'x';
    d.movimentacoes[0].lixo = [1];
    const v = ok(validarDados(d));
    expect(v).toEqual(original);
    expect(Object.keys(v).sort()).toEqual(['movimentacoes', 'produtos', 'versao']);
    expect('segredo' in v.produtos[0]).toBe(false);
    expect('lixo' in v.movimentacoes[0]).toBe(false);
  });

  it('mantém ultimoBackupEm e observacao/motivo quando presentes', () => {
    const d = { ...exemplo(), ultimoBackupEm: AGORA };
    const v = ok(validarDados(d));
    expect(v.ultimoBackupEm).toBe(AGORA);
    expect(v.movimentacoes.some((m) => m.observacao === 'balcão' && m.motivo === 'venda')).toBe(true);
  });

  it.each([null, undefined, 42, 'texto', true, [], [1, 2], () => 1, { versao: 1 }, { versao: 1, produtos: {}, movimentacoes: [] }, { versao: '1', produtos: [], movimentacoes: [] }])(
    'recusa sem lançar: %s',
    (valor) => {
      expect(validarDados(valor)).toEqual({ ok: false, erro: ERRO_ARQUIVO });
    },
  );

  it('não lança com lixo aninhado', () => {
    const lixos: unknown[] = [
      { versao: 1, produtos: [null], movimentacoes: [] },
      { versao: 1, produtos: [[]], movimentacoes: [] },
      { versao: 1, produtos: [], movimentacoes: [42] },
      { versao: 1, produtos: [{ nome: {} }], movimentacoes: [{ produtoId: [] }] },
      { versao: 1, produtos: [], movimentacoes: [], ultimoBackupEm: 5 },
    ];
    for (const l of lixos) expect(validarDados(l)).toEqual({ ok: false, erro: ERRO_ARQUIVO });
  });

  it('movimentação com produtoId inexistente', () => {
    const d = clone(exemplo());
    d.movimentacoes[0].produtoId = 'nao-existe';
    expect(validarDados(d)).toEqual({ ok: false, erro: ERRO_ARQUIVO });
  });

  it.each([
    ['precoCentavos 1.5', (d: any) => (d.produtos[0].precoCentavos = 1.5)],
    ['precoCentavos -1', (d: any) => (d.produtos[0].precoCentavos = -1)],
    ['precoCentavos acima do limite', (d: any) => (d.produtos[0].precoCentavos = 100_000_001)],
    ['precoCentavos string', (d: any) => (d.produtos[0].precoCentavos = '10')],
    ['precoCentavos NaN-like (null)', (d: any) => (d.produtos[0].precoCentavos = null)],
    ['quantidadeMil acima do limite', (d: any) => (d.produtos[1].quantidadeMil = 1_000_000_001)],
    ['estoqueMinimoMil negativo', (d: any) => (d.produtos[0].estoqueMinimoMil = -1000)],
    ['estoqueMinimoMil fracionário', (d: any) => (d.produtos[1].estoqueMinimoMil = 0.5)],
    ['un com saldo não múltiplo de 1000', (d: any) => (d.produtos[0].quantidadeMil = 1500)],
    ['un com movimentação não múltipla de 1000', (d: any) => (d.movimentacoes[0].quantidadeMil = 10_500)],
    ['unidade inválida', (d: any) => (d.produtos[0].unidade = 'm')],
    ['nome vazio', (d: any) => (d.produtos[0].nome = '   ')],
    ['nome com mais de 80 caracteres', (d: any) => (d.produtos[0].nome = 'a'.repeat(81))],
    ['nome não string', (d: any) => (d.produtos[0].nome = 7)],
    ['categoria não string', (d: any) => (d.produtos[0].categoria = null)],
    ['id vazio', (d: any) => (d.produtos[0].id = '')],
    ['criadoEm ausente', (d: any) => delete d.produtos[0].criadoEm],
    ['atualizadoEm inválido', (d: any) => (d.produtos[0].atualizadoEm = 'ontem')],
    ['tipo de movimentação inválido', (d: any) => (d.movimentacoes[0].tipo = 'troca')],
    ['motivo inválido', (d: any) => (d.movimentacoes.find((m: any) => m.tipo === 'saida').motivo = 'roubo')],
    ['motivo em entrada', (d: any) => (d.movimentacoes[0].motivo = 'venda')],
    ['quantidade da movimentação zero', (d: any) => (d.movimentacoes[0].quantidadeMil = 0)],
    ['quantidade da movimentação fracionária', (d: any) => (d.movimentacoes[0].quantidadeMil = 10.5)],
    ['saldoAposMil negativo', (d: any) => (d.movimentacoes[0].saldoAposMil = -1)],
    ['observacao não string', (d: any) => (d.movimentacoes[0].observacao = 3)],
    ['criadaEm inválido', (d: any) => (d.movimentacoes[0].criadaEm = 'x')],
    ['ultimoBackupEm não string', (d: any) => (d.ultimoBackupEm = 1)],
    ['ids de produto repetidos', (d: any) => (d.produtos[1].id = d.produtos[0].id)],
    ['ids de movimentação repetidos', (d: any) => (d.movimentacoes[1].id = d.movimentacoes[0].id)],
    ['nomes repetidos sem caixa', (d: any) => (d.produtos[1].nome = ' ARROZ 5 KG ')],
  ])('recusa %s', (_n, mexer) => {
    const d = clone(exemplo());
    mexer(d);
    expect(validarDados(d)).toEqual({ ok: false, erro: ERRO_ARQUIVO });
  });

  it('produto com quantidadeMil alterado à mão', () => {
    const d = clone(exemplo());
    d.produtos[0].quantidadeMil = 3000; // histórico dá 2000
    expect(validarDados(d)).toEqual({
      ok: false,
      erro: 'Backup inconsistente: o saldo de "Arroz 5 kg" não confere com o histórico.',
    });
  });

  it('saldo sem nenhuma movimentação também é inconsistente', () => {
    const d = clone(exemplo());
    d.movimentacoes = [];
    expect(validarDados(d)).toEqual({
      ok: false,
      erro: 'Backup inconsistente: o saldo de "Arroz 5 kg" não confere com o histórico.',
    });
  });

  it('lerBackup repassa o erro de saldo', () => {
    const d = clone(exemplo());
    d.produtos[0].quantidadeMil = 3000;
    expect(lerBackup(JSON.stringify(d))).toEqual({
      ok: false,
      erro: 'Backup inconsistente: o saldo de "Arroz 5 kg" não confere com o histórico.',
    });
  });
});
