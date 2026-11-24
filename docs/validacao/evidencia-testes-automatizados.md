Situação: preenchido com a execução real de `npm test` em 2026-11-23. Este arquivo cobre apenas os testes automatizados; a validação com o comerciante ainda não aconteceu e está nos outros arquivos desta pasta, em branco.

# Evidência dos testes automatizados

Data da execução: 2026-11-23
Comando: `npm test` (executa `vitest run`), na pasta do projeto, branch `feat/controle-estoque`.

## Saída da execução

```
> controle-estoque@0.0.0 test
> vitest run


 RUN  v5.1.1 /home/texera/Documents/Faculdade/controle-estoque


 Test Files  13 passed (13)
      Tests  201 passed (201)
   Start at  21:12:13
   Duration  4.38s (environment 59%, tests 24%, setup 8%, import 7%, transform 1%, worker 1%)
```

Resultado: 13 arquivos de teste e 201 testes, todos passaram, nenhum falhou. Esta é a execução feita depois das correções da revisão final.

## Testes por arquivo

| Arquivo | Testes |
|---|---|
| `src/dominio/estoque.test.ts` | 38 |
| `src/dominio/numeros.test.ts` | 26 |
| `src/armazenamento/backup.test.ts` | 61 |
| `src/armazenamento/csv.test.ts` | 12 |
| `src/armazenamento/local.test.ts` | 8 |
| `src/armazenamento/baixar.test.ts` | 1 |
| `src/telas/Produtos.test.tsx` | 11 |
| `src/telas/Historico.test.tsx` | 7 |
| `src/telas/Backup.test.tsx` | 9 |
| `src/App.fluxos.test.tsx` | 12 |
| `src/App.falhaGravacao.test.tsx` | 5 |
| `src/App.test.tsx` | 4 |
| `src/useDados.test.ts` | 7 |
| Total | 201 |

## Correspondência com os quatro testes previstos no slide 7

Os nomes abaixo são os nomes reais dos testes no código. O formato é `grupo > nome do teste`.

### 1. Cadastro válido e validação de campos

Arquivo: `src/dominio/estoque.test.ts`, grupo `cadastro`.

- `cria produto válido com nome aparado`
- `recusa nome vazio`
- `recusa nome com mais de 80 caracteres`
- `recusa nome duplicado sem diferenciar caixa`
- `recusa preço negativo ou não inteiro`
- `recusa decimal em un`
- `recusa quantidade e mínimo negativos ou não inteiros (kg)`
- `aceita decimal em kg`
- `recusa valores acima do limite`
- `devolve todos os erros de uma vez`

Na tela, em `src/App.fluxos.test.tsx`: `cadastra um produto`, `recusa nome duplicado e mantém o formulário aberto`, `mostra erro de texto inválido e de decimal em un`.

### 2. Entrada e saída de mercadorias

Arquivo: `src/dominio/estoque.test.ts`.

- Grupo `entrada e saída`: `entrada soma e registra saldo`, `saída subtrai com motivo`, `observação vazia vira undefined`, `invariante: saldo = entradas - saídas após 6 movimentações`.
- Grupo `estoque inicial`: `gera movimentação de entrada`, `não gera movimentação com quantidade zero`.

Na tela, em `src/App.fluxos.test.tsx`: `registra entrada com observação`.

### 3. Bloqueio de saldo negativo

Arquivo: `src/dominio/estoque.test.ts`, grupo `bloqueio`.

- `saída maior que o saldo é recusada`
- `saída igual ao saldo zera`
- `quantidade zero, negativa ou não inteira`
- `decimal em un`
- `produto inexistente`

Grupo `imutabilidade`: `nenhuma operação altera o objeto recebido, inclusive as recusadas`.

Na tela, em `src/App.fluxos.test.tsx`: `bloqueia saída maior que o saldo`. Em `src/telas/Produtos.test.tsx`: `saída com saldo zero fica desabilitada; com saldo, habilitada`.

### 4. Alerta de estoque baixo

Arquivo: `src/dominio/estoque.test.ts`, grupo `alerta`.

- `4000 com mínimo 5000 -> true` (abaixo do mínimo)
- `5000 com mínimo 5000 -> true` (igual ao mínimo)
- `6000 com mínimo 5000 -> false` (acima do mínimo)
- `0 com mínimo 0 -> true` (mínimo zero, produto zerado)
- `1000 com mínimo 0 -> false` (mínimo zero, produto com saldo)

Na tela, em `src/telas/Produtos.test.tsx`: `linha do Arroz mostra baixo, quantidade e mínimo; Feijão não mostra baixo` e `filtro Estoque baixo esconde o Feijão e marca aria-pressed`.

## Outros testes (além dos quatro previstos)

- Conversão de números ("1,5" para milésimos e de volta): `src/dominio/numeros.test.ts`.
- Exportar e importar backup preserva os dados, arquivo inválido é recusado: `src/armazenamento/backup.test.ts`.
- CSV com acento e vírgula decimal: `src/armazenamento/csv.test.ts`.
- Leitura e gravação no `localStorage`: `src/armazenamento/local.test.ts`.
- Exclusão de produto remove o histórico: `src/dominio/estoque.test.ts` (grupo `exclusão`) e `src/App.fluxos.test.tsx` (`excluir produto pede confirmação e remove`).

## O que esta evidência não mostra

Ela prova que as regras do aplicativo funcionam nos testes automáticos. Não prova que um comerciante consegue usar o aplicativo. Isso depende da demonstração real, que ainda não foi feita.
