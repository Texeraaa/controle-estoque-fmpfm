import { describe, expect, it } from 'vitest';
import { criarProduto, dadosVazios, type EntradaProduto } from '../dominio/estoque';
import type { Dados } from '../dominio/tipos';
import { gerarCsv } from './csv';

const AGORA = '2026-11-23T15:00:00.000Z';
const T0 = '2026-11-20T10:00:00.000Z';

function com(d: Dados, e: Partial<EntradaProduto> & { nome: string }): Dados {
  const r = criarProduto(
    d,
    { categoria: '', precoCentavos: 100, unidade: 'un', quantidadeMil: 1000, estoqueMinimoMil: 0, ...e },
    T0,
  );
  if (!r.ok) throw new Error('falha no setup: ' + JSON.stringify(r.erro));
  return r.valor;
}

function exemplo(): Dados {
  let d = com(dadosVazios(), { nome: 'Queijo minas', categoria: 'Frios', precoCentavos: 4200, unidade: 'kg', quantidadeMil: 800, estoqueMinimoMil: 1000 });
  d = com(d, { nome: 'Arroz 5 kg', categoria: 'Mercearia', precoCentavos: 2890, unidade: 'un', quantidadeMil: 2000, estoqueMinimoMil: 5000 });
  d = com(d, { nome: 'Leite', categoria: 'Frios', precoCentavos: 500, unidade: 'L', quantidadeMil: 12_000, estoqueMinimoMil: 2000 });
  return d;
}

function linhas(conteudo: string): string[] {
  return conteudo.split('\r\n');
}

describe('gerarCsv', () => {
  it('começa com BOM e usa o cabeçalho esperado', () => {
    const { conteudo } = gerarCsv(exemplo(), AGORA);
    expect(conteudo.startsWith('\uFEFF')).toBe(true);
    expect(linhas(conteudo)[0]).toBe(
      '\uFEFFNome;Categoria;Unidade;Quantidade;Estoque mínimo;Preço;Valor em estoque;Situação',
    );
  });

  it('usa \\r\\n entre linhas e produtos em ordem alfabética', () => {
    const l = linhas(gerarCsv(exemplo(), AGORA).conteudo);
    expect(l).toHaveLength(4);
    expect(l[1]).toBe('Arroz 5 kg;Mercearia;un;2;5;28,90;57,80;baixo');
    expect(l[2]).toBe('Leite;Frios;L;12;2;5,00;60,00;ok');
    expect(l[3]).toBe('Queijo minas;Frios;kg;0,8;1;42,00;33,60;baixo');
    expect(gerarCsv(exemplo(), AGORA).conteudo).not.toMatch(/[^\r]\n/);
  });

  it('sem produtos gera só o cabeçalho', () => {
    expect(linhas(gerarCsv(dadosVazios(), AGORA).conteudo)).toHaveLength(1);
  });

  it('nome do arquivo usa a data local', () => {
    const nome = gerarCsv(dadosVazios(), AGORA).nomeArquivo;
    expect(nome).toMatch(/^estoque-2026-11-2\d\.csv$/);
    const d = new Date(2026, 0, 5, 0, 30);
    expect(gerarCsv(dadosVazios(), d.toISOString()).nomeArquivo).toBe('estoque-2026-01-05.csv');
  });

  it('campo com ; ou aspas vai entre aspas, aspas duplicadas', () => {
    const d = com(dadosVazios(), { nome: 'Molho; "especial"' });
    expect(linhas(gerarCsv(d, AGORA).conteudo)[1].startsWith('"Molho; ""especial""";')).toBe(true);
  });

  it('campo com quebra de linha vai entre aspas', () => {
    const d = com(dadosVazios(), { nome: 'Prod', categoria: 'a\nb' });
    expect(gerarCsv(d, AGORA).conteudo).toContain('Prod;"a\nb";un;');
  });

  it.each(['=', '+', '-', '@'])('texto começando por %s recebe apóstrofo', (c) => {
    const d = com(dadosVazios(), { nome: `${c}SOMA(A1)`, categoria: `${c}cat` });
    expect(linhas(gerarCsv(d, AGORA).conteudo)[1].startsWith(`'${c}SOMA(A1);'${c}cat;`)).toBe(true);
  });

  it('proteção de fórmula e aspas se combinam', () => {
    const d = com(dadosVazios(), { nome: '=SOMA(A1)' });
    expect(linhas(gerarCsv(d, AGORA).conteudo)[1].startsWith("'=SOMA(A1);")).toBe(true);
    const d2 = com(dadosVazios(), { nome: '=A1;B1' });
    expect(linhas(gerarCsv(d2, AGORA).conteudo)[1].startsWith('"\'=A1;B1";')).toBe(true);
  });

  it('colunas numéricas nunca recebem apóstrofo', () => {
    const d = com(dadosVazios(), { nome: 'Zero', precoCentavos: 0, quantidadeMil: 0, estoqueMinimoMil: 0 });
    expect(linhas(gerarCsv(d, AGORA).conteudo)[1]).toBe('Zero;;un;0;0;0,00;0,00;baixo');
    const l = linhas(gerarCsv(exemplo(), AGORA).conteudo).slice(1);
    for (const x of l) expect(x).not.toContain(";'");
  });
});
