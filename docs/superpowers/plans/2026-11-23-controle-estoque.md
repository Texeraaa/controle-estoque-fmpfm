# Controle de Estoque Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o aplicativo web de controle de estoque (cadastro, entrada, saída, alerta, histórico e backup) que roda sem servidor, offline e instalável no celular.

**Architecture:** Regras de estoque como funções puras em `src/dominio/`, que recebem `Dados` e devolvem novos `Dados` ou um erro. `src/armazenamento/` cuida de localStorage, backup JSON e CSV. As telas React só leem `Dados` e chamam o domínio; nenhuma tela calcula saldo.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, vite-plugin-pwa. CSS próprio, sem biblioteca de componentes, sem roteador, sem biblioteca de estado.

**Spec:** `docs/superpowers/specs/2026-11-23-controle-estoque-design.md` — leia antes de qualquer tarefa.

## Global Constraints

- Interface, mensagens e nomes de domínio em português do Brasil.
- Dinheiro em centavos inteiros (`precoCentavos`); quantidade em milésimos inteiros (`quantidadeMil`). Nunca `float` em dado armazenado.
- O saldo só muda por movimentação. Nenhuma função altera `quantidadeMil` fora de `criarProduto`, `registrarEntrada` e `registrarSaida`.
- Para todo produto: `quantidadeMil` = soma das entradas − soma das saídas.
- Movimentações são imutáveis.
- Chave do localStorage: `controle-estoque:v1`.
- Dependências de produção: apenas `react` e `react-dom`.
- Alerta de estoque baixo nunca depende só de cor: sempre a etiqueta de texto `baixo`.
- Alvos de toque com pelo menos 44 px; campos numéricos com `inputmode="decimal"`; fonte de 16 px ou mais nos campos (evita zoom no iOS).
- Tema claro apenas. Coluna única, largura máxima de 560 px centralizada no computador.
- Limites: nome com até 80 caracteres; quantidade e estoque mínimo até 1.000.000 (1e9 milésimos); preço até R$ 1.000.000,00 (1e8 centavos).
- Nada é publicado na internet neste plano. Publicação na Vercel exige autorização separada.
- O arquivo `Projeto_Controle_de_Estoque.pptx` não é modificado.
- Commits locais ao fim de cada tarefa, mensagem em português no formato `feat: ...` / `test: ...` / `docs: ...`, terminando com a linha `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Sem `git push`.

## Review Focus

1. **Duas abas abertas.** A segunda aba grava por cima com dados velhos. Esperado: ao receber o evento `storage` da chave, a aba recarrega os dados. Teste na Tarefa 5.
2. **Número digitado em formato de milhar ou com símbolo** (`1.234,56`, `R$ 10`, `1,5,2`). Esperado: `1.234,56` vira 123456 centavos; os outros são recusados, nunca convertidos para um valor errado. Teste na Tarefa 2.
3. **Backup editado à mão com saldo que não bate com as movimentações.** Esperado: importação recusada, dados atuais intactos. Teste na Tarefa 4.
4. **Produto com nome começando por `=`, `+`, `-` ou `@` exportado para CSV.** Esperado: a célula recebe apóstrofo na frente, para o Excel não interpretar como fórmula. Teste na Tarefa 4.
5. **Valores gigantes** (quantidade `999999999999`). Esperado: erro "Valor muito alto." em vez de saldo impreciso. Teste na Tarefa 3.

---

## Estrutura de arquivos

```
index.html
vite.config.ts               config do Vite, Vitest e PWA
src/
  main.tsx                   monta <App/>
  App.tsx                    aba ativa, erros globais, composição das telas
  useDados.ts                estado Dados + gravação + evento storage
  estilos.css                todo o CSS
  dominio/
    tipos.ts                 tipos da seção 5 da spec + Resultado
    numeros.ts               texto <-> centavos/milésimos, formatação
    estoque.ts               regras da seção 6 da spec, consultas
  armazenamento/
    backup.ts                validarDados, gerarBackup, lerBackup
    local.ts                 carregar, salvar
    csv.ts                   gerarCsv
    baixar.ts                baixarArquivo (Blob + <a download>)
  telas/
    Produtos.tsx  Historico.tsx  Backup.tsx
  componentes/
    Abas.tsx  FormularioProduto.tsx  FolhaMovimentacao.tsx
docs/validacao/              cinco modelos em Markdown
```

Testes ficam ao lado do arquivo testado: `numeros.test.ts`, `Produtos.test.tsx` etc.

---

### Task 1: Estrutura do projeto

**Files:**
- Create: `.gitignore`, `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/estilos.css`, `src/setupTestes.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: scripts `npm test` (= `vitest run`), `npm run dev`, `npm run build` (= `tsc -b && vite build`), `npm run preview`. Vitest com ambiente `jsdom`, `globals: true` e `setupFiles: src/setupTestes.ts` (importa `@testing-library/jest-dom/vitest`).

- [ ] **Step 1:** `git init` na raiz, se ainda não for repositório. `.gitignore` com `node_modules`, `dist`, `.superpowers`, `*.local`.
- [ ] **Step 2:** Criar o projeto Vite React + TypeScript **na raiz existente**, sem apagar `docs/` nem o pptx. Instalar como dev: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`. Remover os arquivos de exemplo do template (logos, `App.css`, contador). `index.html` com `lang="pt-BR"`, título `Controle de Estoque` e `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- [ ] **Step 3: Teste que falha** em `src/App.test.tsx`:

```tsx
test('mostra o título do app', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Estoque' })).toBeInTheDocument();
});
```

- [ ] **Step 4:** `npm test` — esperado: FALHA.
- [ ] **Step 5:** `App.tsx` renderiza `<h1>Estoque</h1>`; `main.tsx` importa `estilos.css`.
- [ ] **Step 6:** `npm test` passa e `npm run build` termina sem erro.
- [ ] **Step 7:** Commit: `feat: estrutura do projeto com Vite, React e Vitest`. Inclui `docs/` e o pptx no primeiro commit.

---

### Task 2: Conversão e formatação de números

**Files:**
- Create: `src/dominio/tipos.ts`, `src/dominio/numeros.ts`
- Test: `src/dominio/numeros.test.ts`

**Interfaces:**
- Produces, em `tipos.ts`: `Unidade`, `MotivoSaida`, `Produto`, `Movimentacao`, `Dados` exatamente como na seção 5 da spec, mais:

```ts
export type Resultado<T, E = string> = { ok: true; valor: T } | { ok: false; erro: E };
export const UNIDADES: Unidade[] = ['un', 'kg', 'L'];
export const MAX_QUANTIDADE_MIL = 1_000_000_000;
export const MAX_PRECO_CENTAVOS = 100_000_000;
export const MAX_NOME = 80;
```

- Produces, em `numeros.ts`:

```ts
// Inteiro escalado por 10^casas, ou null se vazio, inválido, negativo ou com mais casas que o permitido.
export function parseDecimal(texto: string, casas: number): number | null;
export function parsePreco(texto: string): number | null;                       // centavos
export function parseQuantidade(texto: string, unidade: Unidade): number | null; // milésimos; 'un' só aceita inteiros
export function numeroParaTexto(valor: number, casas: number): string;           // 1500,3 -> "1,5"; 2000,3 -> "2"; 2890,2 -> "28,90"
export function formatarQuantidade(mil: number, unidade: Unidade): string;       // "2 un", "1,5 kg", "0,8 kg", "3 L"
export function formatarPreco(centavos: number): string;                         // "R$ 28,90", com espaço comum
export function formatarDataHora(iso: string): string;                           // "23/11/2026 14:02", fuso local
```

Regras de `parseDecimal`: apara espaços; se houver vírgula, pontos são separador de milhar e são removidos, e a vírgula é o decimal; sem vírgula, o ponto é o decimal; o que sobrar precisa casar com `^\d+(\.\d+)?$`. `numeroParaTexto` com `casas = 2` mantém sempre duas casas; com `casas = 3` remove zeros à direita. `formatarPreco` usa `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` e troca ` ` por espaço.

- [ ] **Step 1: Testes que falham:**

```ts
test.each([
  ['28,90', 2890], ['28.9', 2890], ['0', 0], [' 10 ', 1000], ['1.234,56', 123456],
])('parsePreco(%s) = %i', (t, v) => expect(parsePreco(t)).toBe(v));

test.each(['', 'abc', '-1', 'R$ 10', '1,5,2', '1,999'])(
  'parsePreco(%s) é recusado', (t) => expect(parsePreco(t)).toBeNull());

test('parseQuantidade respeita a unidade', () => {
  expect(parseQuantidade('1,5', 'kg')).toBe(1500);
  expect(parseQuantidade('0,125', 'L')).toBe(125);
  expect(parseQuantidade('3', 'un')).toBe(3000);
  expect(parseQuantidade('1,5', 'un')).toBeNull();
  expect(parseQuantidade('1,2345', 'kg')).toBeNull();
});

test('formatação', () => {
  expect(formatarQuantidade(2000, 'un')).toBe('2 un');
  expect(formatarQuantidade(1500, 'kg')).toBe('1,5 kg');
  expect(formatarQuantidade(800, 'kg')).toBe('0,8 kg');
  expect(formatarPreco(2890)).toBe('R$ 28,90');
  expect(formatarPreco(481200)).toBe('R$ 4.812,00');
  expect(numeroParaTexto(2890, 2)).toBe('28,90');
  expect(numeroParaTexto(2000, 3)).toBe('2');
});

test('ida e volta não perde valor', () => {
  for (const mil of [1, 125, 1500, 999999])
    expect(parseQuantidade(numeroParaTexto(mil, 3), 'kg')).toBe(mil);
});
```

- [ ] **Step 2:** `npx vitest run src/dominio/numeros.test.ts` — esperado: FALHA.
- [ ] **Step 3:** Implementar `tipos.ts` e `numeros.ts`. A conversão para inteiro é feita sobre a string (parte inteira e parte decimal completada com zeros), sem multiplicar `float`.
- [ ] **Step 4:** Testes passam.
- [ ] **Step 5:** Commit: `feat: conversão e formatação de preço e quantidade`.

---

### Task 3: Regras de estoque

**Files:**
- Create: `src/dominio/estoque.ts`
- Test: `src/dominio/estoque.test.ts`

**Interfaces:**
- Consumes: tudo de `tipos.ts`; `formatarQuantidade` de `numeros.ts`.
- Produces:

```ts
export interface EntradaProduto {
  nome: string; categoria: string; precoCentavos: number;
  unidade: Unidade; quantidadeMil: number; estoqueMinimoMil: number;
}
export type AlteracaoProduto = Pick<EntradaProduto, 'nome' | 'categoria' | 'precoCentavos' | 'estoqueMinimoMil'>;
export type ErrosProduto = Partial<Record<'nome' | 'preco' | 'quantidade' | 'estoqueMinimo', string>>;

export function dadosVazios(): Dados;  // { versao: 1, produtos: [], movimentacoes: [] }
export function criarProduto(dados: Dados, entrada: EntradaProduto, agora?: string): Resultado<Dados, ErrosProduto>;
export function editarProduto(dados: Dados, id: string, alt: AlteracaoProduto, agora?: string): Resultado<Dados, ErrosProduto>;
export function excluirProduto(dados: Dados, id: string): Dados;
export function contarMovimentacoes(dados: Dados, produtoId: string): number;
export function registrarEntrada(dados: Dados, produtoId: string, quantidadeMil: number, observacao?: string, agora?: string): Resultado<Dados>;
export function registrarSaida(dados: Dados, produtoId: string, quantidadeMil: number, motivo: MotivoSaida, observacao?: string, agora?: string): Resultado<Dados>;
export function emAlerta(p: Produto): boolean;
export function valorEmEstoqueCentavos(p: Produto): number;  // Math.round(precoCentavos * quantidadeMil / 1000)
export function resumo(dados: Dados): { totalProdutos: number; emAlerta: number; valorCentavos: number };
export function categorias(dados: Dados): string[];           // distintas, não vazias, em ordem alfabética
export function filtrarProdutos(produtos: Produto[], busca: string, soBaixo: boolean): Produto[];
export function filtrarMovimentacoes(dados: Dados, filtro: { produtoId?: string; tipo?: 'entrada' | 'saida' }): Movimentacao[];
```

Todas as funções são puras e nunca mutam o `dados` recebido. `agora` tem padrão `new Date().toISOString()`; ids vêm de `crypto.randomUUID()`. Nome e categoria são gravados já aparados; observação vazia vira `undefined`.

Mensagens exatas:

| Condição | Campo / retorno | Texto |
|---|---|---|
| nome vazio ou só espaços | `nome` | `Informe o nome do produto.` |
| nome com mais de 80 caracteres | `nome` | `O nome pode ter no máximo 80 caracteres.` |
| nome já usado (sem diferenciar caixa, aparado) | `nome` | `Já existe um produto com esse nome.` |
| negativo ou não inteiro | campo correspondente | `Informe um valor válido.` |
| unidade `un` com milésimos não múltiplos de 1000 | `quantidade` / `estoqueMinimo` | `Para unidade "un", use números inteiros.` |
| acima do limite | campo correspondente | `Valor muito alto.` |
| movimentação com quantidade ≤ 0 ou não inteira | erro | `Informe uma quantidade maior que zero.` |
| movimentação decimal em `un` | erro | `Para unidade "un", use números inteiros.` |
| saída maior que o saldo | erro | `Saída maior que o saldo. Disponível: ${formatarQuantidade(saldo, unidade)}.` |
| entrada que passaria do limite | erro | `Valor muito alto.` |
| produto inexistente | erro | `Produto não encontrado.` |

`filtrarProdutos`: compara nome e categoria sem caixa e sem acentos (`normalize('NFD')` removendo diacríticos), ordena por nome com `localeCompare(…, 'pt-BR')`. `filtrarMovimentacoes`: mais recente primeiro por `criadaEm`; em empate, a registrada por último vem primeiro.

- [ ] **Step 1: Testes que falham.** Um `describe` por linha da tabela da seção 10 da spec. Use um auxiliar `base()` que cria Arroz (un, 2890 centavos, quantidade 2000, mínimo 5000). Asserções obrigatórias:

```ts
// cadastro
expect(r.valor.produtos[0]).toMatchObject({ nome: 'Arroz 5 kg', quantidadeMil: 2000 });   // nome '  Arroz 5 kg ' é aparado
expect(criarProduto(d, { ...e, nome: '   ' })).toEqual({ ok: false, erro: { nome: 'Informe o nome do produto.' } });
expect(criarProduto(d, { ...e, nome: 'ARROZ 5 KG ' }).erro.nome).toBe('Já existe um produto com esse nome.');
expect(criarProduto(vazio, { ...e, precoCentavos: -1 }).erro.preco).toBe('Informe um valor válido.');
expect(criarProduto(vazio, { ...e, unidade: 'un', quantidadeMil: 1500 }).erro.quantidade).toBe('Para unidade "un", use números inteiros.');
expect(criarProduto(vazio, { ...e, quantidadeMil: 999_999_999_999_000 }).erro.quantidade).toBe('Valor muito alto.');
// estoque inicial
expect(d.movimentacoes).toEqual([expect.objectContaining({ tipo: 'entrada', quantidadeMil: 2000, observacao: 'Estoque inicial', saldoAposMil: 2000 })]);
expect(criarProduto(vazio, { ...e, quantidadeMil: 0 }).valor.movimentacoes).toHaveLength(0);
// edição
editar com o próprio nome não acusa duplicidade; quantidadeMil e unidade não mudam; atualizadoEm muda
// entrada e saída
entrada de 3000 -> quantidadeMil 5000, movimentação com saldoAposMil 5000
saída de 1000 com 'perda' -> quantidadeMil 1000, motivo 'perda'
// bloqueio
expect(registrarSaida(d, id, 3000, 'venda')).toEqual({ ok: false, erro: 'Saída maior que o saldo. Disponível: 2 un.' });
saída de 2000 (igual ao saldo) -> ok, quantidadeMil 0
expect(registrarSaida(d, id, 0, 'venda').erro).toBe('Informe uma quantidade maior que zero.');
expect(registrarEntrada(d, id, 1_000_000_000).erro).toBe('Valor muito alto.');
// invariante: após uma sequência de 6 movimentações, quantidadeMil === soma(entradas) - soma(saídas)
// imutabilidade: o objeto dados original continua igual (structuredClone antes, toEqual depois) em todas as operações, inclusive nas recusadas
// alerta
emAlerta: 4000/5000 true; 5000/5000 true; 6000/5000 false; 0/0 true; 1000/0 false
// exclusão
excluirProduto remove o produto e só as movimentações dele; contarMovimentacoes confere antes
// consultas
resumo -> { totalProdutos, emAlerta, valorCentavos } com 2 un a R$ 28,90 + 0,8 kg a R$ 42,00 = 5780 + 3360 = 9140
filtrarProdutos(ps, 'feijao', false) encontra 'Feijão carioca'; busca por categoria 'MERCEARIA' encontra; soBaixo filtra; ordem alfabética com 'Água' antes de 'Arroz'
filtrarMovimentacoes mais recente primeiro; filtra por produtoId e por tipo
```

- [ ] **Step 2:** `npx vitest run src/dominio/estoque.test.ts` — esperado: FALHA.
- [ ] **Step 3:** Implementar `estoque.ts`.
- [ ] **Step 4:** Testes passam; `npx tsc -b` sem erro.
- [ ] **Step 5:** Commit: `feat: regras de estoque, movimentações e consultas`.

---

### Task 4: Armazenamento, backup e CSV

**Files:**
- Create: `src/armazenamento/backup.ts`, `src/armazenamento/local.ts`, `src/armazenamento/csv.ts`, `src/armazenamento/baixar.ts`
- Test: `src/armazenamento/backup.test.ts`, `src/armazenamento/local.test.ts`, `src/armazenamento/csv.test.ts`

**Interfaces:**
- Consumes: tipos; `dadosVazios`, `emAlerta`, `valorEmEstoqueCentavos`, `filtrarProdutos` de `estoque.ts`; `numeroParaTexto` de `numeros.ts`.
- Produces:

```ts
// backup.ts
export function validarDados(valor: unknown): Resultado<Dados>;
export function gerarBackup(dados: Dados, agora?: string): { nomeArquivo: string; conteudo: string; dados: Dados };
export function lerBackup(texto: string): Resultado<Dados>;
// local.ts
export const CHAVE = 'controle-estoque:v1';
export function carregar(): { ok: true; dados: Dados } | { ok: false; bruto: string };
export function salvar(dados: Dados): boolean;
// csv.ts
export function gerarCsv(dados: Dados, agora?: string): { nomeArquivo: string; conteudo: string };
// baixar.ts
export function baixarArquivo(nome: string, conteudo: string, tipo: string): void;
```

`validarDados` devolve os dados somente se tudo valer: `versao === 1`; arrays presentes; todo campo com o tipo da seção 5 da spec; inteiros não negativos dentro dos limites; `unidade`, `tipo` e `motivo` dentro dos valores permitidos; ids únicos; nomes únicos (sem caixa); toda movimentação aponta para produto existente; para cada produto, `quantidadeMil` = entradas − saídas. Erros: `Arquivo de backup inválido.` para estrutura ou tipos e `Backup inconsistente: o saldo de "${nome}" não confere com o histórico.` para o saldo. Campos desconhecidos são descartados.

`gerarBackup`: nome `estoque-backup-AAAA-MM-DD.json` (data local); `dados` devolvido e `conteudo` já trazem `ultimoBackupEm = agora`; JSON indentado com 2 espaços. `lerBackup`: `JSON.parse` em `try`; falha vira `Arquivo de backup inválido.`.

`carregar`: chave ausente → `{ ok: true, dados: dadosVazios() }`; JSON ilegível ou reprovado em `validarDados` → `{ ok: false, bruto }`. `salvar`: `try/catch` em `setItem`, devolve `false` se lançar.

`gerarCsv`: nome `estoque-AAAA-MM-DD.csv`; começa com `﻿`; linhas separadas por `\r\n`; cabeçalho `Nome;Categoria;Unidade;Quantidade;Estoque mínimo;Preço;Valor em estoque;Situação`; produtos em ordem alfabética; números com vírgula decimal e sem símbolo; situação `ok` ou `baixo`. Campo com `;`, aspas ou quebra de linha vai entre aspas com aspas duplicadas. Campo de texto começando por `=`, `+`, `-` ou `@` recebe `'` na frente.

- [ ] **Step 1: Testes que falham:**

```ts
// backup
exportar e ler de volta: lerBackup(gerarBackup(d, agora).conteudo).valor toEqual { ...d, ultimoBackupEm: agora }
gerarBackup(d, '2026-11-23T15:00:00.000Z').nomeArquivo casa com /^estoque-backup-2026-11-2\d\.json$/
lerBackup('não é json'), lerBackup('{"versao":2}'), lerBackup('[]'), lerBackup('Nome;Categoria') -> erro 'Arquivo de backup inválido.'
movimentação com produtoId inexistente -> 'Arquivo de backup inválido.'
precoCentavos: 1.5 ou -1 -> 'Arquivo de backup inválido.'
produto com quantidadeMil alterado à mão -> 'Backup inconsistente: o saldo de "Arroz 5 kg" não confere com o histórico.'
// local
sem chave -> dados vazios; salvar + carregar devolve o mesmo; localStorage.setItem(CHAVE, '{quebrado') -> { ok: false, bruto: '{quebrado' } e a chave continua com o mesmo conteúdo
vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('cheio'); }) -> salvar(d) === false
// csv
conteudo começa com '﻿'; linhas[1] === 'Arroz 5 kg;Mercearia;un;2;5;28,90;57,80;baixo'
linha do queijo: 'Queijo minas;Frios;kg;0,8;1;42,00;33,60;baixo'
nome 'Molho; "especial"' -> '"Molho; ""especial"""'
nome '=SOMA(A1)' -> "'=SOMA(A1)"
```

- [ ] **Step 2:** Rodar os três arquivos de teste — esperado: FALHA.
- [ ] **Step 3:** Implementar os quatro arquivos. `baixarArquivo` cria `Blob`, `URL.createObjectURL`, clica num `<a download>` temporário e revoga a URL; não tem teste automatizado.
- [ ] **Step 4:** Testes passam.
- [ ] **Step 5:** Commit: `feat: armazenamento local, backup JSON e exportação CSV`.

---

### Task 5: Estado, abas e tela de Produtos

Antes de escrever a interface, o implementador carrega as skills `minimalist-ui` e `mobile-native` e segue a seção 7 da spec e o mockup `.superpowers/brainstorm/140756-1795476656/content/tela-inicial.html` (opção A).

**Files:**
- Create: `src/useDados.ts`, `src/componentes/Abas.tsx`, `src/telas/Produtos.tsx`
- Modify: `src/App.tsx`, `src/estilos.css`, `src/App.test.tsx`
- Test: `src/useDados.test.ts`, `src/telas/Produtos.test.tsx`

**Interfaces:**
- Consumes: `carregar`, `salvar`, `CHAVE`; `resumo`, `filtrarProdutos`, `emAlerta`; formatadores.
- Produces:

```ts
// useDados.ts
export function useDados(): {
  dados: Dados;
  aplicar: (novos: Dados) => boolean;   // grava; se falhar, mantém o estado anterior e devolve false
  erroCarga: string | null;             // conteúdo bruto ilegível, se houver
  erroGravacao: boolean;
  descartarCorrompido: () => void;      // começa do zero após o usuário decidir
};
// Abas.tsx
export type Aba = 'produtos' | 'historico' | 'backup';
export function Abas(props: { ativa: Aba; aoMudar: (a: Aba) => void }): JSX.Element;
// Produtos.tsx
export function Produtos(props: {
  dados: Dados;
  aoNovo: () => void;
  aoEditar: (p: Produto) => void;
  aoMovimentar: (p: Produto, tipo: 'entrada' | 'saida') => void;
}): JSX.Element;
```

`useDados`: com `erroCarga`, `aplicar` não grava nada (o conteúdo ilegível não pode ser sobrescrito) até `descartarCorrompido`. Escuta `window` `storage`; quando `event.key === CHAVE`, recarrega. `App`: título `Estoque`, aba ativa em `useState<Aba>`, `Abas` fixas no rodapé como `<nav>` com botões `aria-current="page"` na ativa. Com `erroGravacao`, faixa `Não foi possível salvar. Exporte um backup na aba Backup.`. Com `erroCarga`, tela `Os dados salvos estão ilegíveis.` com os botões `Baixar dados brutos` e `Começar do zero` (este com `confirm`). Nesta tarefa, as abas Histórico e Backup mostram só o título, e `aoNovo`, `aoEditar` e `aoMovimentar` ainda não abrem nada.

`Produtos`: resumo com três blocos (`N produtos`, `N em alerta`, `R$ … em estoque`); o bloco de alerta é um botão que liga o filtro. Campo `type="search"` com rótulo acessível `Buscar produto`. Dois botões de filtro com `aria-pressed`: `Todos` e `Estoque baixo (N)`. Cada linha: botão com o nome (abre edição), etiqueta `baixo` se em alerta, categoria e preço, quantidade formatada, `mín. X`, e os botões `aria-label="Registrar saída de {nome}"` e `aria-label="Registrar entrada de {nome}"`; o de saída fica `disabled` com saldo zero. Botão `Novo produto`. Vazios: `Nenhum produto cadastrado` e `Nenhum produto encontrado`.

- [ ] **Step 1: Testes que falham:**

```tsx
// useDados.test.ts (renderHook)
aplicar grava: localStorage[CHAVE] passa a conter o produto e result.current.dados também
setItem lançando -> aplicar devolve false, dados inalterados, erroGravacao true
localStorage com '{quebrado' -> erroCarga === '{quebrado', aplicar devolve false e a chave não muda
evento storage: gravar novos dados direto no localStorage e disparar new StorageEvent('storage', { key: CHAVE }) -> dados reflete o novo conteúdo

// Produtos.test.tsx — dados com Arroz (2 un, mín. 5), Feijão (18 un, mín. 6), Queijo (0,8 kg, mín. 1 kg), Refrigerante (0 un, mín. 0)
mostra '4 produtos', '3 em alerta' e o valor total formatado
linha do Arroz contém 'baixo', '2 un', 'mín. 5 un'; linha do Feijão não contém 'baixo'
digitar 'feijao' na busca deixa só o Feijão
clicar 'Estoque baixo (3)' esconde o Feijão; clicar no bloco '3 em alerta' faz o mesmo
buscar 'xyz' mostra 'Nenhum produto encontrado'; dados vazios mostra 'Nenhum produto cadastrado'
botão 'Registrar saída de Refrigerante' está desabilitado
clicar 'Registrar entrada de Arroz' chama aoMovimentar(arroz, 'entrada'); clicar no nome chama aoEditar(arroz)
```

- [ ] **Step 2:** Rodar — esperado: FALHA.
- [ ] **Step 3:** Implementar hook, `Abas`, `Produtos`, `App` e o CSS da estrutura (coluna, cabeçalho, abas no rodapé com `padding-bottom: env(safe-area-inset-bottom)`, lista, resumo, etiquetas).
- [ ] **Step 4:** `npm test` passa; `npm run build` sem erro.
- [ ] **Step 5:** Commit: `feat: estado da aplicação, abas e tela de produtos`.

---

### Task 6: Formulário de produto e folha de movimentação

**Files:**
- Create: `src/componentes/FormularioProduto.tsx`, `src/componentes/FolhaMovimentacao.tsx`
- Modify: `src/App.tsx`, `src/estilos.css`
- Test: `src/App.fluxos.test.tsx`

**Interfaces:**
- Consumes: `criarProduto`, `editarProduto`, `excluirProduto`, `contarMovimentacoes`, `registrarEntrada`, `registrarSaida`, `categorias`; `parsePreco`, `parseQuantidade`, `numeroParaTexto`, `formatarQuantidade`; `useDados().aplicar`.
- Produces:

```ts
export function FormularioProduto(props: {
  dados: Dados; produto: Produto | null;          // null = novo
  aoAplicar: (novos: Dados) => boolean; aoFechar: () => void;
}): JSX.Element;
export function FolhaMovimentacao(props: {
  dados: Dados; produto: Produto; tipo: 'entrada' | 'saida';
  aoAplicar: (novos: Dados) => boolean; aoFechar: () => void;
}): JSX.Element;
```

Os dois usam `<dialog>` aberto com `showModal()` (fecha com Esc e devolve o foco). Em telas estreitas a folha de movimentação fica ancorada embaixo. Fecham sozinhos quando `aoAplicar` devolve `true`.

`FormularioProduto`: título `Novo produto` ou `Editar produto`. Campos rotulados `Nome` (`maxlength=80`), `Categoria` (com `<datalist>` de `categorias(dados)`), `Preço (R$)`, `Unidade` (select), `Quantidade inicial`, `Estoque mínimo`. Campo de número vazio vale zero; texto que `parse*` recusa mostra `Informe um valor válido.`, exceto decimal em `un`, que mostra `Para unidade "un", use números inteiros.`. Erros do domínio aparecem sob o campo, ligados por `aria-describedby`, só depois de tentar salvar. Na edição: unidade e quantidade somente leitura com o texto `Para alterar a quantidade, registre uma entrada ou saída.`, e botão `Excluir produto` com `confirm('Excluir "{nome}"? {n} movimentações também serão apagadas.')`. Botões `Salvar` e `Cancelar`.

`FolhaMovimentacao`: título `Entrada · {nome}` ou `Saída · {nome}`; linha `Saldo atual: {formatarQuantidade}`. Campo `Quantidade` com foco automático. Na saída, grupo de botões de rádio `Motivo`: `Venda` (marcado), `Perda`, `Ajuste`. Campo `Observação (opcional)`. Botão `Registrar entrada` ou `Registrar saída`. Na saída, enquanto a quantidade digitada for maior que o saldo, a mensagem `Saída maior que o saldo. Disponível: X.` aparece (`role="alert"`) e o botão fica `disabled`.

`App` passa a guardar qual diálogo está aberto e liga `aoNovo`, `aoEditar`, `aoMovimentar`.

- [ ] **Step 1: Testes de fluxo que falham** em `src/App.fluxos.test.tsx`, renderizando `<App />` com `localStorage` limpo a cada teste (jsdom não implementa `showModal`; defina `HTMLDialogElement.prototype.showModal` e `close` no `setupTestes.ts` alternando o atributo `open`):

```tsx
test('cadastra um produto', async () => {
  // clicar 'Novo produto'; preencher Nome 'Arroz 5 kg', Categoria 'Mercearia', Preço '28,90', Quantidade inicial '2', Estoque mínimo '5'; Salvar
  // espera: diálogo fechado; lista com 'Arroz 5 kg', '2 un', 'baixo'; resumo '1 produtos' ou '1 produto' conforme implementado, e 'R$ 57,80'
  // espera: JSON.parse(localStorage[CHAVE]).movimentacoes[0].observacao === 'Estoque inicial'
});
test('recusa nome duplicado e mantém o formulário aberto', ...);          // mensagem 'Já existe um produto com esse nome.'
test('bloqueia saída maior que o saldo', async () => {
  // com Arroz 2 un: clicar 'Registrar saída de Arroz 5 kg'; digitar '3'
  // espera: alerta 'Saída maior que o saldo. Disponível: 2 un.'; botão 'Registrar saída' desabilitado
  // trocar para '1', escolher 'Perda', registrar -> lista mostra '1 un'; movimentação salva com motivo 'perda'
});
test('edição não altera a quantidade', ...);                               // campo de quantidade somente leitura; salvar novo preço mantém '2 un'
test('excluir produto pede confirmação e remove', ...);                    // vi.spyOn(window, 'confirm')
```

O resumo usa singular e plural corretos: `1 produto`, `2 produtos`. Ajuste o teste da Tarefa 5 se necessário.

- [ ] **Step 2:** Rodar — esperado: FALHA.
- [ ] **Step 3:** Implementar os dois componentes, a ligação em `App` e o CSS de diálogo, campos e erros.
- [ ] **Step 4:** `npm test` passa; `npm run build` sem erro.
- [ ] **Step 5:** Commit: `feat: formulário de produto e registro de entrada e saída`.

---

### Task 7: Telas de Histórico e Backup

**Files:**
- Create: `src/telas/Historico.tsx`, `src/telas/Backup.tsx`
- Modify: `src/App.tsx`, `src/estilos.css`
- Test: `src/telas/Historico.test.tsx`, `src/telas/Backup.test.tsx`

**Interfaces:**
- Consumes: `filtrarMovimentacoes`, formatadores; `gerarBackup`, `lerBackup`, `gerarCsv`, `baixarArquivo`.
- Produces:

```ts
export function Historico(props: { dados: Dados }): JSX.Element;
export function Backup(props: { dados: Dados; aoAplicar: (novos: Dados) => boolean }): JSX.Element;
```

`Historico`: selects rotulados `Produto` (opção `Todos os produtos` + produtos em ordem alfabética) e `Tipo` (`Todas`, `Entradas`, `Saídas`). Cada item: `Entrada` ou `Saída`, nome do produto, quantidade com sinal (`+3 un`, `−1 un`), motivo quando houver, observação quando houver, `formatarDataHora(criadaEm)` e `Saldo: X`. Mostra 50 itens e o botão `Mostrar mais` enquanto houver mais. Vazio: `Nenhuma movimentação registrada`.

`Backup`:
- Texto fixo: `Seus dados ficam salvos apenas neste aparelho e neste navegador. Exporte um backup com frequência.`
- Linha de estado: `Nenhum backup feito ainda`, `Último backup: hoje` ou `Último backup: há N dias`.
- Botão `Exportar backup`: `gerarBackup`, `baixarArquivo(nome, conteudo, 'application/json')` e `aoAplicar(resultado.dados)`.
- Botão `Importar backup`: `<input type="file" accept="application/json,.json">` com rótulo `Importar backup`. Arquivo inválido mostra o erro de `lerBackup` em `role="alert"` e não altera nada. Arquivo válido mostra `Este backup tem N produtos e M movimentações. Importar substitui todos os dados atuais.` com os botões `Substituir dados` e `Cancelar`. Depois de substituir: `Backup importado.`.
- Botão `Exportar planilha (CSV)`: `gerarCsv` e `baixarArquivo(nome, conteudo, 'text/csv;charset=utf-8')`.

- [ ] **Step 1: Testes que falham** (com `vi.mock('../armazenamento/baixar')`):

```tsx
// Historico — dados com 3 movimentações de Arroz e 1 de Feijão
lista começa pela mais recente; saída aparece como '−1 un' com 'perda'; entrada inicial mostra 'Estoque inicial'
filtrar por Produto 'Feijão carioca 1 kg' deixa 1 item; filtrar por Tipo 'Saídas' deixa só saídas
com 60 movimentações mostra 50 e, após 'Mostrar mais', 60
dados vazios -> 'Nenhuma movimentação registrada'

// Backup
sem ultimoBackupEm -> 'Nenhum backup feito ainda'
clicar 'Exportar backup' -> baixarArquivo chamado com nome /estoque-backup-.*\.json/ e aoAplicar chamado com dados contendo ultimoBackupEm
userEvent.upload de File(['lixo'], 'x.json') -> alerta 'Arquivo de backup inválido.' e aoAplicar não chamado
upload de backup válido -> 'Este backup tem 2 produtos e 3 movimentações.'; 'Cancelar' não chama aoAplicar; 'Substituir dados' chama aoAplicar com os dados do arquivo
clicar 'Exportar planilha (CSV)' -> baixarArquivo chamado com nome /estoque-.*\.csv/ e tipo 'text/csv;charset=utf-8'
```

- [ ] **Step 2:** Rodar — esperado: FALHA.
- [ ] **Step 3:** Implementar as duas telas e ligá-las às abas em `App`.
- [ ] **Step 4:** `npm test` passa; `npm run build` sem erro.
- [ ] **Step 5:** Commit: `feat: telas de histórico e backup`.

---

### Task 8: PWA, acabamento visual e verificação no navegador

Carregar as skills `minimalist-ui`, `mobile-native` e `emil-design-eng` antes do acabamento.

**Files:**
- Create: `public/icone.svg`, `public/icone-192.png`, `public/icone-512.png`
- Modify: `vite.config.ts`, `index.html`, `src/estilos.css`, `package.json`

- [ ] **Step 1:** Instalar `vite-plugin-pwa` como dev. Se houver conflito de versão com o Vite instalado, usar a maior versão do Vite que o plugin aceita. Configurar `registerType: 'autoUpdate'` e manifesto: `name: 'Controle de Estoque'`, `short_name: 'Estoque'`, `lang: 'pt-BR'`, `display: 'standalone'`, `start_url: '.'`, `background_color` e `theme_color` iguais ao fundo do app, ícones 192 e 512 (PNG, `purpose: 'any maskable'`). Ícone: desenho simples de caixa em SVG, convertido para PNG com a ferramenta disponível na máquina.
- [ ] **Step 2:** `index.html`: `<meta name="theme-color">`, `<link rel="apple-touch-icon">`, `<meta name="description" content="Controle de estoque simples para pequenos comércios.">`.
- [ ] **Step 3:** Acabamento do CSS conforme a seção 7.6 da spec e as Global Constraints: alvos de 44 px, foco visível, contraste AA, sem realce de toque nem seleção de texto em botões, `100dvh`, área segura do aparelho, `prefers-reduced-motion` respeitado. Nenhuma mudança de comportamento.
- [ ] **Step 4:** `npm test` passa. `npm run build` gera `dist/manifest.webmanifest` e `dist/sw.js`.
- [ ] **Step 5: Verificação real.** `npm run preview` e, num navegador com largura de 390 px, executar o roteiro: cadastrar três produtos (um em kg), registrar entrada, registrar saída, tentar saída maior que o saldo, filtrar estoque baixo, ver o histórico, exportar backup, importar o mesmo backup, exportar CSV, recarregar a página e conferir que os dados continuam. Registrar o que foi observado; corrigir o que falhar e repetir.
- [ ] **Step 6:** Commit: `feat: PWA instalável e acabamento visual`.

---

### Task 9: Documentos de validação e README

**Files:**
- Create: `README.md`, `docs/validacao/roteiro-demonstracao.md`, `docs/validacao/roteiro-teste-manual.md`, `docs/validacao/ficha-levantamento.md`, `docs/validacao/ficha-feedback.md`, `docs/validacao/registro-ajustes.md`, `docs/validacao/evidencia-testes-automatizados.md`

- [ ] **Step 1:** Escrever os cinco modelos conforme a seção 11 da spec. O roteiro de teste manual é uma tabela `Passo | Ação | Resultado esperado | Resultado obtido | Data`, com as duas últimas colunas vazias. A ficha de levantamento traz uma pergunta para cada linha da seção 12 da spec. Todos os campos de resposta ficam **em branco**: nenhum resultado, nome de comerciante, data ou feedback é inventado. Cada arquivo começa com `Situação: não preenchido — preencher somente após a atividade real.`
- [ ] **Step 2:** `evidencia-testes-automatizados.md`: saída real de `npm test`, com data, quantidade de testes e a correspondência com os quatro testes previstos no slide 7.
- [ ] **Step 3:** `README.md`: o que é o projeto, como rodar (`npm install`, `npm run dev`, `npm test`, `npm run build`), onde os dados ficam, como fazer backup, limitações da versão e as três divergências em relação ao pptx (seção 13 da spec).
- [ ] **Step 4:** Commit: `docs: roteiros de validação, evidência de testes e README`.
