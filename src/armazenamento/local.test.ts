import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarProduto, dadosVazios } from '../dominio/estoque';
import type { Dados } from '../dominio/tipos';
import { CHAVE, carregar, salvar } from './local';

function exemplo(): Dados {
  const r = criarProduto(
    dadosVazios(),
    { nome: 'Arroz 5 kg', categoria: 'Mercearia', precoCentavos: 2890, unidade: 'un', quantidadeMil: 2000, estoqueMinimoMil: 5000 },
    '2026-11-20T10:00:00.000Z',
  );
  if (!r.ok) throw new Error('falha no setup');
  return r.valor;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('armazenamento local', () => {
  it('usa a chave controle-estoque:v1', () => {
    expect(CHAVE).toBe('controle-estoque:v1');
  });

  it('sem chave devolve dados vazios', () => {
    expect(carregar()).toEqual({ ok: true, dados: dadosVazios() });
  });

  it('salvar + carregar devolve o mesmo', () => {
    const d = exemplo();
    expect(salvar(d)).toBe(true);
    expect(localStorage.getItem(CHAVE)).toBe(JSON.stringify(d));
    expect(carregar()).toEqual({ ok: true, dados: d });
  });

  it('JSON ilegível devolve o bruto e não sobrescreve a chave', () => {
    localStorage.setItem(CHAVE, '{quebrado');
    expect(carregar()).toEqual({ ok: false, bruto: '{quebrado' });
    expect(localStorage.getItem(CHAVE)).toBe('{quebrado');
  });

  it('JSON válido mas reprovado na validação devolve o bruto', () => {
    const d = JSON.parse(JSON.stringify(exemplo()));
    d.produtos[0].quantidadeMil = 1000;
    const bruto = JSON.stringify(d);
    localStorage.setItem(CHAVE, bruto);
    expect(carregar()).toEqual({ ok: false, bruto });
    expect(localStorage.getItem(CHAVE)).toBe(bruto);
  });

  it('valor salvo como "null" é reprovado, não lança', () => {
    localStorage.setItem(CHAVE, 'null');
    expect(carregar()).toEqual({ ok: false, bruto: 'null' });
  });

  it('salvar devolve false se setItem lançar', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('cheio');
    });
    expect(salvar(exemplo())).toBe(false);
  });

  it('carregar não lança se getItem lançar', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(() => carregar()).not.toThrow();
  });
});
