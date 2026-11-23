import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';
import { CHAVE } from './armazenamento/local';

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

const guardado = () => JSON.parse(localStorage.getItem(CHAVE) ?? '{}');

async function preencherProduto(nome: string, preco = '28,90', qtd = '2', minimo = '5') {
  await userEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
  await userEvent.type(screen.getByLabelText('Nome'), nome);
  await userEvent.type(screen.getByLabelText('Categoria'), 'Mercearia');
  await userEvent.type(screen.getByLabelText('Preço (R$)'), preco);
  await userEvent.type(screen.getByLabelText('Quantidade inicial'), qtd);
  await userEvent.type(screen.getByLabelText('Estoque mínimo'), minimo);
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
}

async function comArroz() {
  render(<App />);
  await preencherProduto('Arroz 5 kg');
}

test('cadastra um produto', async () => {
  await comArroz();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('Arroz 5 kg')).toBeInTheDocument();
  expect(screen.getByText('2 un')).toBeInTheDocument();
  expect(screen.getByText('baixo')).toBeInTheDocument();
  expect(screen.getByText('1 produto')).toBeInTheDocument();
  expect(screen.getByText(/R\$\s57,80/)).toBeInTheDocument();
  expect(guardado().movimentacoes[0].observacao).toBe('Estoque inicial');
});

test('recusa nome duplicado e mantém o formulário aberto', async () => {
  await comArroz();
  await preencherProduto('arroz 5 kg');
  const dialogo = screen.getByRole('dialog');
  expect(within(dialogo).getByText('Já existe um produto com esse nome.')).toBeInTheDocument();
  expect(within(dialogo).getByLabelText('Nome')).toHaveAccessibleDescription('Já existe um produto com esse nome.');
  expect(guardado().produtos).toHaveLength(1);
});

test('mostra erro de texto inválido e de decimal em un', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
  await userEvent.type(screen.getByLabelText('Preço (R$)'), 'abc');
  await userEvent.type(screen.getByLabelText('Quantidade inicial'), '1,5');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  expect(screen.getByText('Informe o nome do produto.')).toBeInTheDocument();
  expect(screen.getByText('Informe um valor válido.')).toBeInTheDocument();
  expect(screen.getByText('Para unidade "un", use números inteiros.')).toBeInTheDocument();
});

test('bloqueia saída maior que o saldo', async () => {
  await comArroz();
  await userEvent.click(screen.getByRole('button', { name: 'Registrar saída de Arroz 5 kg' }));
  const quantidade = screen.getByLabelText('Quantidade');
  expect(quantidade).toHaveFocus();
  expect(screen.getByText('Saldo atual: 2 un')).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Venda' })).toBeChecked();
  await userEvent.type(quantidade, '3');
  expect(screen.getByRole('alert')).toHaveTextContent('Saída maior que o saldo. Disponível: 2 un.');
  expect(screen.getByRole('button', { name: 'Registrar saída' })).toBeDisabled();
  await userEvent.clear(quantidade);
  await userEvent.type(quantidade, '1');
  await userEvent.click(screen.getByRole('radio', { name: 'Perda' }));
  await userEvent.click(screen.getByRole('button', { name: 'Registrar saída' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('1 un')).toBeInTheDocument();
  const movs = guardado().movimentacoes;
  expect(movs[movs.length - 1]).toMatchObject({ tipo: 'saida', motivo: 'perda', quantidadeMil: 1000 });
});

test('registra entrada com observação', async () => {
  await comArroz();
  await userEvent.click(screen.getByRole('button', { name: 'Registrar entrada de Arroz 5 kg' }));
  await userEvent.type(screen.getByLabelText('Quantidade'), '4');
  await userEvent.type(screen.getByLabelText('Observação (opcional)'), 'Compra do fornecedor');
  await userEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
  expect(screen.getByText('6 un')).toBeInTheDocument();
  const movs = guardado().movimentacoes;
  expect(movs[movs.length - 1]).toMatchObject({ tipo: 'entrada', observacao: 'Compra do fornecedor' });
});

test('Cancelar fecha sem gravar', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('edição não altera a quantidade', async () => {
  await comArroz();
  await userEvent.click(screen.getByRole('button', { name: 'Arroz 5 kg' }));
  expect(screen.getByRole('heading', { name: 'Editar produto' })).toBeInTheDocument();
  expect(screen.getByLabelText('Quantidade inicial')).toHaveAttribute('readonly');
  expect(screen.getByLabelText('Unidade')).toBeDisabled();
  expect(screen.getByText('Para alterar a quantidade, registre uma entrada ou saída.')).toBeInTheDocument();
  const preco = screen.getByLabelText('Preço (R$)');
  expect(preco).toHaveValue('28,90');
  await userEvent.clear(preco);
  await userEvent.type(preco, '30');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('2 un')).toBeInTheDocument();
  expect(guardado().produtos[0].precoCentavos).toBe(3000);
});

test('excluir produto pede confirmação e remove', async () => {
  await comArroz();
  const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  await userEvent.click(screen.getByRole('button', { name: 'Arroz 5 kg' }));
  await userEvent.click(screen.getByRole('button', { name: 'Excluir produto' }));
  expect(confirmar).toHaveBeenCalledWith('Excluir "Arroz 5 kg"? 1 movimentação também será apagada.');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Excluir produto' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('Nenhum produto cadastrado')).toBeInTheDocument();
  expect(guardado().movimentacoes).toHaveLength(0);
});
