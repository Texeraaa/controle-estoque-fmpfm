import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { criarProduto, dadosVazios, registrarEntrada, registrarSaida } from '../dominio/estoque';
import { formatarDataHora } from '../dominio/numeros';
import type { Dados } from '../dominio/tipos';
import { Historico } from './Historico';

function ok(r: { ok: boolean; valor?: Dados; erro?: unknown }): Dados {
  if (!r.ok) throw new Error(JSON.stringify(r.erro));
  return r.valor as Dados;
}

function base(): Dados {
  let d = dadosVazios();
  d = ok(criarProduto(d, { nome: 'Arroz 5 kg', categoria: '', precoCentavos: 2890, unidade: 'un', quantidadeMil: 10000, estoqueMinimoMil: 0 }, '2026-03-01T10:00:00.000Z'));
  d = ok(criarProduto(d, { nome: 'Feijão carioca 1 kg', categoria: '', precoCentavos: 850, unidade: 'un', quantidadeMil: 4000, estoqueMinimoMil: 0 }, '2026-03-01T10:01:00.000Z'));
  const arroz = d.produtos.find((p) => p.nome === 'Arroz 5 kg')!;
  d = ok(registrarEntrada(d, arroz.id, 3000, undefined, '2026-03-02T10:00:00.000Z'));
  d = ok(registrarSaida(d, arroz.id, 1000, 'perda', 'caiu no chão', '2026-03-03T10:00:00.000Z'));
  return d;
}

test('lista da mais recente para a mais antiga com sinal, motivo, observação, data e saldo', () => {
  const d = base();
  render(<Historico dados={d} />);
  const itens = screen.getAllByRole('listitem');
  expect(itens).toHaveLength(4);
  const primeiro = within(itens[0]);
  expect(primeiro.getByText('Saída')).toBeInTheDocument();
  expect(primeiro.getByText('Arroz 5 kg')).toBeInTheDocument();
  expect(primeiro.getByText('\u22121 un')).toBeInTheDocument();
  expect(primeiro.getByText('perda')).toBeInTheDocument();
  expect(primeiro.getByText('caiu no chão')).toBeInTheDocument();
  expect(primeiro.getByText(formatarDataHora('2026-03-03T10:00:00.000Z'))).toBeInTheDocument();
  expect(primeiro.getByText('Saldo: 12 un')).toBeInTheDocument();
  expect(within(itens[1]).getByText('+3 un')).toBeInTheDocument();
  expect(within(itens[3]).getByText('Estoque inicial')).toBeInTheDocument();
});

test('filtra por produto', async () => {
  render(<Historico dados={base()} />);
  await userEvent.selectOptions(screen.getByLabelText('Produto'), 'Feijão carioca 1 kg');
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
});

test('filtra por tipo', async () => {
  render(<Historico dados={base()} />);
  await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'Saídas');
  const itens = screen.getAllByRole('listitem');
  expect(itens).toHaveLength(1);
  expect(within(itens[0]).getByText('Saída')).toBeInTheDocument();
});

test('lista os produtos em ordem alfabética no seletor', () => {
  render(<Historico dados={base()} />);
  const nomes = within(screen.getByLabelText('Produto')).getAllByRole('option').map((o) => o.textContent);
  expect(nomes).toEqual(['Todos os produtos', 'Arroz 5 kg', 'Feijão carioca 1 kg']);
});

test('mostra 50 por vez e carrega mais', async () => {
  let d = ok(criarProduto(dadosVazios(), { nome: 'Sal', categoria: '', precoCentavos: 100, unidade: 'un', quantidadeMil: 1000, estoqueMinimoMil: 0 }, '2026-01-01T00:00:00.000Z'));
  const id = d.produtos[0].id;
  for (let i = 0; i < 59; i++) {
    d = ok(registrarEntrada(d, id, 1000, undefined, new Date(Date.UTC(2026, 1, 1, 0, i)).toISOString()));
  }
  render(<Historico dados={d} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(50);
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar mais' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(60);
  expect(screen.queryByRole('button', { name: 'Mostrar mais' })).not.toBeInTheDocument();
});

test('sem movimentações mostra mensagem de vazio', () => {
  render(<Historico dados={dadosVazios()} />);
  expect(screen.getByText('Nenhuma movimentação registrada')).toBeInTheDocument();
});

test('filtro sem resultado diz que nada foi encontrado, não que não há registros', async () => {
  render(<Historico dados={base()} />);
  await userEvent.selectOptions(screen.getByLabelText('Produto'), 'Feijão carioca 1 kg');
  await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'Saídas');
  expect(screen.getByText('Nenhuma movimentação encontrada')).toBeInTheDocument();
});
