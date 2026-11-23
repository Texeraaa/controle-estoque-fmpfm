# Controle de Estoque

Aplicativo web simples para pequenos comerciantes controlarem o estoque: cadastrar produtos, registrar entradas e saídas, ver o que está acabando e guardar um backup em arquivo.

É um projeto de extensão do curso de Ciência da Computação (Faculdade Municipal Professor Franco Montoro, 2026), tema "Desenvolvimento de Soluções Digitais para Demandas Locais". A ideia é demonstrar o aplicativo a um comerciante real e registrar o que ele achar. Essa demonstração ainda não aconteceu; os documentos para ela estão em `docs/validacao/` e estão em branco.

O aplicativo não está publicado em lugar nenhum. Hoje ele só roda no computador de quem desenvolve.

## O que o aplicativo faz

- Cadastra, edita e exclui produtos (nome, categoria, preço, unidade, quantidade inicial, estoque mínimo).
- Registra entradas e saídas. Saída maior que o saldo é bloqueada.
- Mostra a etiqueta `baixo` nos produtos com saldo igual ou menor que o estoque mínimo, e filtra só esses.
- Busca por nome ou categoria.
- Mantém o histórico de movimentações (nada é editado nem apagado; o erro se corrige com uma nova movimentação).
- Exporta e importa backup em arquivo, e exporta a lista de produtos em planilha (CSV).
- Foi feito para funcionar offline e para ser instalado no celular (PWA).

Três abas: **Produtos**, **Histórico** e **Backup**.

## Como rodar

Precisa do Node.js instalado.

```bash
npm install        # instala as dependências
npm run dev        # abre o aplicativo em modo de desenvolvimento
npm test           # roda os testes automatizados
npm run build      # gera a versão de produção na pasta dist/
npm run preview    # serve a versão gerada pelo build, para conferir
```

Para rodar o `npm run preview`, execute antes o `npm run build`.

## Onde os dados ficam

Os dados ficam só neste navegador, neste aparelho, no `localStorage`, na chave `controle-estoque:v1`. Não existe servidor nem conta.

Isto significa que:

- Outro navegador ou outro aparelho começa vazio.
- Limpar os dados do navegador apaga o estoque.
- Desinstalar o aplicativo ou usar uma janela anônima pode apagar ou esconder os dados.

Por isso o backup existe.

## Como fazer backup e restaurar

Na aba **Backup**:

- **Exportar backup** baixa um arquivo `estoque-backup-AAAA-MM-DD.json` com todos os produtos e movimentações. A tela mostra há quantos dias foi o último backup.
- **Importar backup** lê um arquivo desse tipo, mostra quantos produtos e movimentações ele tem e só substitui os dados atuais depois de você tocar em **Substituir dados**. Arquivo inválido é recusado e nada muda.
- **Exportar planilha (CSV)** baixa `estoque-AAAA-MM-DD.csv`, que abre direto no Excel em português. Serve para consulta; não serve como backup.

Guarde o arquivo `.json` fora do aparelho (e-mail, nuvem, pendrive).

## Limitações desta versão

- O backup é manual. Se você esquecer de exportar e perder os dados do navegador, não há como recuperar.
- Um aparelho, um navegador, uma pessoa. Não há login nem sincronização entre aparelhos.
- Sem servidor, banco na nuvem, vendas, caixa, nota fiscal, código de barras, fornecedores ou relatórios gráficos.
- Unidades disponíveis: `un`, `kg` e `L`. A unidade não muda depois que o produto é criado.
- A quantidade de um produto só muda por entrada ou saída. Para corrigir uma contagem, registre uma entrada ou uma saída com motivo "Ajuste".
- Limites: nome com até 80 caracteres, quantidade e estoque mínimo até 1.000.000, preço até R$ 1.000.000,00.
- O armazenamento do navegador tem limite de cerca de 5 MB, suficiente para centenas de produtos e alguns milhares de movimentações.
- Só tema claro.
- Não foi validado com o público-alvo. Os testes automatizados mostram que as regras funcionam, não que um comerciante consegue usar.

## Testes e validação

- Testes automatizados (Vitest): rode `npm test`. O resultado da execução de 2026-11-23 está em `docs/validacao/evidencia-testes-automatizados.md`, com a ligação aos quatro testes previstos no slide 7.
- Validação com o comerciante: roteiros e fichas em `docs/validacao/`, todos em branco até a atividade acontecer de verdade.

## Divergências em relação ao pptx

O arquivo `Projeto_Controle_de_Estoque.pptx` não foi alterado. Depois da construção, ele precisa ser atualizado para não contradizer o aplicativo:

1. Slide 3: o cadastro passa a incluir preço e unidade.
2. Slide 6: a limitação deixa de ser "sem backup" e passa a ser "backup manual em arquivo, sem login, nuvem ou integração com vendas". O histórico de movimentações entra nas funcionalidades.
3. Slide 6: "arquivo HTML" passa a ser "aplicação web acessada por link".

## Tecnologias

React, TypeScript, Vite, Vitest e Testing Library. O único código de produção além do próprio projeto é `react` e `react-dom`. As regras de estoque ficam em `src/dominio/`, o armazenamento em `src/armazenamento/`, as telas em `src/telas/` e os componentes em `src/componentes/`.
