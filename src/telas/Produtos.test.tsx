import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { dadosVazios } from '../dominio/estoque';
import { formatarPreco } from '../dominio/numeros';
import type { Dados, Produto, Unidade } from '../dominio/tipos';
import { Produtos } from './Produtos';

function produto(nome: string, unidade: Unidade, qtdMil: number, minMil: number, preco: number, categoria = 'Geral'): Produto {
  return {
    id: nome,
    nome,
    categoria,
    precoCentavos: preco,
    unidade,
    quantidadeMil: qtdMil,
    estoqueMinimoMil: minMil,
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  };
}

const arroz = produto('Arroz', 'un', 2000, 5000, 2890, 'Mercearia');
const feijao = produto('Feijão', 'un', 18000, 6000, 850, 'Mercearia');
const queijo = produto('Queijo', 'kg', 800, 1000, 4200, 'Frios');
const refri = produto('Refrigerante', 'un', 0, 0, 900, 'Bebidas');
const dados: Dados = { ...dadosVazios(), produtos: [arroz, feijao, queijo, refri] };

function montar(d: Dados = dados) {
  const aoNovo = vi.fn();
  const aoEditar = vi.fn();
  const aoMovimentar = vi.fn();
  render(<Produtos dados={d} aoNovo={aoNovo} aoEditar={aoEditar} aoMovimentar={aoMovimentar} />);
  return { aoNovo, aoEditar, aoMovimentar };
}

const linha = (nome: string) => screen.getByRole('button', { name: nome }).closest('li') as HTMLElement;

test('mostra o resumo com singular e plural corretos', () => {
  montar();
  // 2890*2 + 850*18 + 4200*0,8 + 0 = 5780 + 15300 + 3360 = 24440
  expect(screen.getByText('4 produtos')).toBeInTheDocument();
  expect(screen.getByText('3 em alerta')).toBeInTheDocument();
  expect(screen.getByText(`${formatarPreco(24440)} em estoque`)).toBeInTheDocument();
});

test('usa singular com um produto', () => {
  montar({ ...dadosVazios(), produtos: [feijao] });
  expect(screen.getByText('1 produto')).toBeInTheDocument();
  expect(screen.getByText('0 em alerta')).toBeInTheDocument();
});

test('linha do Arroz mostra baixo, quantidade e mínimo; Feijão não mostra baixo', () => {
  montar();
  const a = within(linha('Arroz'));
  expect(a.getByText('baixo')).toBeInTheDocument();
  expect(a.getByText('2 un')).toBeInTheDocument();
  expect(a.getByText('mín. 5 un')).toBeInTheDocument();
  expect(a.getByText(`Mercearia · ${formatarPreco(2890)}`)).toBeInTheDocument();
  expect(within(linha('Feijão')).queryByText('baixo')).not.toBeInTheDocument();
});

test('lista em ordem alfabética', () => {
  montar();
  const nomes = screen.getAllByRole('listitem').map((li) => within(li).getAllByRole('button')[0].textContent);
  expect(nomes).toEqual(['Arroz', 'Feijão', 'Queijo', 'Refrigerante']);
});

test('busca ignora acento e caixa', async () => {
  montar();
  await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'feijao');
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByText('Feijão')).toBeInTheDocument();
});

test('filtro Estoque baixo esconde o Feijão e marca aria-pressed', async () => {
  montar();
  const todos = screen.getByRole('button', { name: 'Todos' });
  const baixo = screen.getByRole('button', { name: 'Estoque baixo (3)' });
  expect(todos).toHaveAttribute('aria-pressed', 'true');
  expect(baixo).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(baixo);
  expect(screen.queryByText('Feijão')).not.toBeInTheDocument();
  expect(baixo).toHaveAttribute('aria-pressed', 'true');
  expect(todos).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(todos);
  expect(screen.getByText('Feijão')).toBeInTheDocument();
});

test('clicar no bloco de alerta liga o mesmo filtro', async () => {
  montar();
  await userEvent.click(screen.getByRole('button', { name: /3 em alerta/ }));
  expect(screen.queryByText('Feijão')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Estoque baixo (3)' })).toHaveAttribute('aria-pressed', 'true');
});

test('busca sem resultado mostra mensagem', async () => {
  montar();
  await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'xyz');
  expect(screen.getByText('Nenhum produto encontrado')).toBeInTheDocument();
});

test('sem produtos mostra Nenhum produto cadastrado', () => {
  montar(dadosVazios());
  expect(screen.getByText('Nenhum produto cadastrado')).toBeInTheDocument();
  expect(screen.queryByText('Nenhum produto encontrado')).not.toBeInTheDocument();
});

test('saída com saldo zero fica desabilitada; com saldo, habilitada', () => {
  montar();
  expect(screen.getByRole('button', { name: 'Registrar saída de Refrigerante' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Registrar saída de Arroz' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Registrar entrada de Refrigerante' })).toBeEnabled();
});

test('entrada chama aoMovimentar; nome chama aoEditar; Novo produto chama aoNovo', async () => {
  const { aoMovimentar, aoEditar, aoNovo } = montar();
  await userEvent.click(screen.getByRole('button', { name: 'Registrar entrada de Arroz' }));
  expect(aoMovimentar).toHaveBeenCalledWith(arroz, 'entrada');
  await userEvent.click(screen.getByRole('button', { name: 'Registrar saída de Arroz' }));
  expect(aoMovimentar).toHaveBeenCalledWith(arroz, 'saida');
  await userEvent.click(screen.getByRole('button', { name: 'Arroz' }));
  expect(aoEditar).toHaveBeenCalledWith(arroz);
  await userEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
  expect(aoNovo).toHaveBeenCalledTimes(1);
});
