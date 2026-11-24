import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CHAVE } from './armazenamento/local';
import { criarProduto, dadosVazios } from './dominio/estoque';
import type { Dados } from './dominio/tipos';
import { useDados } from './useDados';

function comArroz(): Dados {
  const r = criarProduto(dadosVazios(), {
    nome: 'Arroz',
    categoria: 'Mercearia',
    precoCentavos: 2890,
    unidade: 'un',
    quantidadeMil: 2000,
    estoqueMinimoMil: 5000,
  });
  if (!r.ok) throw new Error('fixture inválida');
  return r.valor;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

test('aplicar grava no localStorage e atualiza o estado', () => {
  const { result } = renderHook(() => useDados());
  let ok = false;
  act(() => {
    ok = result.current.aplicar(comArroz());
  });
  expect(ok).toBe(true);
  expect(localStorage.getItem(CHAVE)).toContain('Arroz');
  expect(result.current.dados.produtos[0].nome).toBe('Arroz');
  expect(result.current.erroGravacao).toBe(false);
});

test('falha ao gravar devolve false, mantém os dados e sinaliza erroGravacao', () => {
  const { result } = renderHook(() => useDados());
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('cheio');
  });
  let ok = true;
  act(() => {
    ok = result.current.aplicar(comArroz());
  });
  expect(ok).toBe(false);
  expect(result.current.dados.produtos).toHaveLength(0);
  expect(result.current.erroGravacao).toBe(true);
});

test('conteúdo ilegível vira erroCarga e aplicar não grava nada', () => {
  localStorage.setItem(CHAVE, '{quebrado');
  const { result } = renderHook(() => useDados());
  expect(result.current.erroCarga).toBe('{quebrado');
  let ok = true;
  act(() => {
    ok = result.current.aplicar(comArroz());
  });
  expect(ok).toBe(false);
  expect(localStorage.getItem(CHAVE)).toBe('{quebrado');
});

test('descartarCorrompido começa do zero e volta a permitir gravação', () => {
  localStorage.setItem(CHAVE, '{quebrado');
  const { result } = renderHook(() => useDados());
  act(() => result.current.descartarCorrompido());
  expect(result.current.erroCarga).toBeNull();
  expect(result.current.dados.produtos).toHaveLength(0);
  let ok = false;
  act(() => {
    ok = result.current.aplicar(comArroz());
  });
  expect(ok).toBe(true);
  expect(localStorage.getItem(CHAVE)).toContain('Arroz');
});

test('evento storage com a chave do app recarrega os dados', () => {
  const { result } = renderHook(() => useDados());
  localStorage.setItem(CHAVE, JSON.stringify(comArroz()));
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: CHAVE }));
  });
  expect(result.current.dados.produtos[0].nome).toBe('Arroz');
});

test('evento storage de outra chave é ignorado', () => {
  const { result } = renderHook(() => useDados());
  localStorage.setItem(CHAVE, JSON.stringify(comArroz()));
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: 'outra' }));
  });
  expect(result.current.dados.produtos).toHaveLength(0);
});

test('getItem que lança vira erroCarga vazio (não nulo) e aplicar não grava nada', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('bloqueado');
  });
  const setItem = vi.spyOn(Storage.prototype, 'setItem');
  const { result } = renderHook(() => useDados());
  expect(result.current.erroCarga).toBe('');
  let ok = true;
  act(() => {
    ok = result.current.aplicar(comArroz());
  });
  expect(ok).toBe(false);
  expect(setItem).not.toHaveBeenCalled();
});
