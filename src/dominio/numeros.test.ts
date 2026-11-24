import { describe, expect, test } from 'vitest';
import {
  formatarDataHora,
  formatarPreco,
  formatarQuantidade,
  numeroParaTexto,
  parsePreco,
  parseQuantidade,
} from './numeros';
import { MAX_PRECO_CENTAVOS, MAX_QUANTIDADE_MIL } from './tipos';

test.each([
  ['28,90', 2890], ['28.9', 2890], ['0', 0], [' 10 ', 1000], ['1.234,56', 123456],
])('parsePreco(%s) = %i', (t, v) => expect(parsePreco(t)).toBe(v));

test.each(['', 'abc', '-1', 'R$ 10', '1,5,2', '1,999'])(
  'parsePreco(%s) é recusado', (t) => expect(parsePreco(t)).toBeNull());

test.each(['1.2.3,4', '12.34,56', '1234.567,8', '.123,4', '1.23,4', '1.234.,5', '1.234,5.6'])(
  'parsePreco(%s) recusa agrupamento de milhar malformado', (t) => expect(parsePreco(t)).toBeNull());

test.each([
  ['12.345.678,9', 1234567890], ['1.234,5', 123450], ['999.999,99', 99999999],
])('parsePreco(%s) aceita milhar de três dígitos', (t, v) => expect(parsePreco(t)).toBe(v));

test('parseQuantidade respeita a unidade', () => {
  expect(parseQuantidade('1,5', 'kg')).toBe(1500);
  expect(parseQuantidade('0,125', 'L')).toBe(125);
  expect(parseQuantidade('3', 'un')).toBe(3000);
  expect(parseQuantidade('1,5', 'un')).toBeNull();
  expect(parseQuantidade('1,2345', 'kg')).toBeNull();
});

test('valor digitado gigante satura em vez de ser recusado', () => {
  const gigante = '9'.repeat(40);
  expect(parseQuantidade(gigante, 'un')! > MAX_QUANTIDADE_MIL).toBe(true);
  expect(parseQuantidade('9007199254740991', 'un')! % 1000).toBe(0);
  expect(parseQuantidade(gigante, 'kg')! > MAX_QUANTIDADE_MIL).toBe(true);
  expect(parsePreco(gigante)! > MAX_PRECO_CENTAVOS).toBe(true);
});

test('formatação', () => {
  expect(formatarQuantidade(2000, 'un')).toBe('2 un');
  expect(formatarQuantidade(1500, 'kg')).toBe('1,5 kg');
  expect(formatarQuantidade(800, 'kg')).toBe('0,8 kg');
  expect(formatarQuantidade(3000, 'L')).toBe('3 L');
  expect(formatarPreco(2890)).toBe('R$ 28,90');
  expect(formatarPreco(481200)).toBe('R$ 4.812,00');
  expect(numeroParaTexto(2890, 2)).toBe('28,90');
  expect(numeroParaTexto(2000, 3)).toBe('2');
});

test('ida e volta não perde valor', () => {
  for (const mil of [1, 125, 1500, 999999])
    expect(parseQuantidade(numeroParaTexto(mil, 3), 'kg')).toBe(mil);
});

describe('formatarDataHora', () => {
  test('usa o fuso local, independente da máquina', () => {
    const iso = new Date(2026, 10, 23, 14, 2).toISOString();
    expect(formatarDataHora(iso)).toBe('23/11/2026 14:02');
  });
});
