# Sistema Digital de Controle de Estoque — Design

Data: 2026-11-23
Origem: `Projeto_Controle_de_Estoque.pptx` (raiz do repositório), formulário do projeto de extensão e entrevista técnica.

Legenda usada neste documento:

- **[Decidido]** — escolhido pelo autor do projeto na entrevista.
- **[Proposta]** — decisão do redator da spec, aceita em bloco ou ainda não contestada. Pode ser revista.
- **[Suposição]** — depende do comerciante real, que ainda não existe. Confirmar no levantamento.

## 1. Intenção

Projeto de extensão do curso de Ciência da Computação (Faculdade Municipal Professor Franco Montoro, 2026), tema "Desenvolvimento de Soluções Digitais para Demandas Locais".

Pequenos comerciantes controlam estoque em caderno ou planilha, o que gera erros, perda de informação e dificuldade para saber o que há disponível e o que repor. O projeto entrega um aplicativo web simples que resolve isso e que será demonstrado a um comerciante real, com coleta de evidências dessa participação.

O sucesso tem duas medidas:

1. Um leigo consegue cadastrar produtos e registrar entradas e saídas no próprio celular, sem treinamento.
2. O projeto gera evidências reais para o relatório: testes executados, demonstração feita, feedback registrado.

## 2. Objetivos, não objetivos e antiobjetivos

**Objetivos**

- Cadastrar, editar e excluir produtos.
- Registrar entradas e saídas, bloqueando saída maior que o saldo.
- Consultar quantidades, buscar produtos e filtrar os de estoque baixo.
- Destacar produtos no estoque mínimo ou abaixo dele.
- Manter histórico de movimentações.
- Exportar e importar backup em arquivo.
- Funcionar offline e ser instalável no celular.

**Não objetivos** (fora desta versão)

- Login, contas, vários usuários.
- Servidor, banco na nuvem, sincronização entre aparelhos.
- Vendas, caixa, emissão de nota, integração com outros sistemas.
- Código de barras, fornecedores, pedidos de compra.
- Relatórios gráficos.
- Tela de gerenciamento de categorias.

**Antiobjetivos** (o projeto falha se isto acontecer, mesmo funcionando)

- O comerciante perde os dados sem ter tido como guardá-los.
- O saldo mostrado não bate com o histórico.
- O relatório ou os slides apresentam a validação com o público-alvo como concluída antes de ela acontecer.
- O app exige explicação para a tarefa mais comum (registrar entrada ou saída).

## 3. Restrições

- Carga horária: 47 h no total; 18 h de desenvolvimento e 9 h de testes, validação e ajustes.
- Não há comerciante confirmado. Tudo que depende da rotina dele está marcado como [Suposição].
- Sem custo de infraestrutura: hospedagem estática gratuita.
- Interface em português do Brasil, moeda em real, datas no formato brasileiro.
- O repositório ainda não é um repositório git e contém apenas o pptx.

## 4. Abordagens consideradas

**Tamanho do aplicativo**

| Opção | O que é | Custo |
|---|---|---|
| A. Fiel ao pptx | Só front-end, dados no navegador | Perda total de dados ao trocar de aparelho ou limpar o navegador |
| **B. Pptx com dados duráveis** | Mesmas funções, mais histórico e backup em arquivo, sem servidor | Backup é manual |
| C. Sistema completo | Backend, banco na nuvem, login | Contradiz a limitação declarada no slide 6 e estoura as 18 h |

**[Decidido] B.** Entrega o que o formulário promete e elimina o risco de perda de dados durante a validação, sem servidor.

**Stack**

| Opção | O que é | Custo |
|---|---|---|
| A. HTML único com JavaScript puro | Abre com duplo clique, sem build | Código num arquivo só, testes automatizados trabalhosos, difícil de abrir no celular |
| **B. Vite + React + TypeScript, PWA** | Site estático acessado por link, instalável, offline | Exige build e hospedagem |

**[Decidido] B.** A demonstração tende a ser no celular do comerciante e os testes automatizados viram evidência para o relatório.

**Tela inicial**

| Opção | O que é | Custo |
|---|---|---|
| **A. Lista primeiro** | Abre nos produtos, resumo compacto no topo, botões − e + por linha | Resumo menos destacado |
| B. Painel primeiro | Abre num resumo de reposição e últimas movimentações | Um toque a mais por registro e uma tela a mais para construir |

**[Decidido] A.** Mockups em `.superpowers/brainstorm/140756-1795476656/content/tela-inicial.html`.

## 5. Modelo de dados

```ts
type Unidade = 'un' | 'kg' | 'L';
type MotivoSaida = 'venda' | 'perda' | 'ajuste';

interface Produto {
  id: string;              // crypto.randomUUID()
  nome: string;            // obrigatório, único
  categoria: string;       // texto livre, pode ser vazio
  precoCentavos: number;   // inteiro >= 0
  unidade: Unidade;        // definida na criação, não editável depois
  quantidadeMil: number;   // saldo em milésimos, inteiro >= 0
  estoqueMinimoMil: number;// em milésimos, inteiro >= 0
  criadoEm: string;        // ISO 8601
  atualizadoEm: string;    // ISO 8601
}

interface Movimentacao {
  id: string;
  produtoId: string;
  tipo: 'entrada' | 'saida';
  quantidadeMil: number;   // inteiro > 0
  motivo?: MotivoSaida;    // só em saídas; padrão 'venda'
  observacao?: string;
  saldoAposMil: number;    // saldo do produto logo após esta movimentação
  criadaEm: string;        // ISO 8601, automática
}

interface Dados {
  versao: 1;
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  ultimoBackupEm?: string;
}
```

**[Proposta] Dinheiro em centavos e quantidade em milésimos, sempre inteiros.** Evita erro de ponto flutuante (0,1 + 0,2) em saldo e valor. A tela converte na entrada e na exibição: `1500` milésimos de kg aparece como "1,5 kg"; `2000` de "un" aparece como "2".

**[Suposição] Unidades un, kg e L.** Cobre loja de peças e mercearia. Para "un" a tela só aceita inteiros; para kg e L aceita até três casas decimais.

**[Proposta] Categoria é texto livre**, com sugestão das categorias já usadas (`<datalist>`).

## 6. Regras de negócio

1. **O saldo só muda por movimentação.** Editar um produto altera nome, categoria, preço e estoque mínimo, nunca a quantidade. Correção de contagem é uma entrada ou uma saída com motivo "ajuste".
2. **Estoque inicial vira movimentação.** Ao cadastrar um produto com quantidade maior que zero, o sistema cria uma entrada com observação "Estoque inicial". Assim, para todo produto, saldo = soma das entradas − soma das saídas.
3. **Saída maior que o saldo é bloqueada**, com a mensagem "Saída maior que o saldo. Disponível: X" e o botão de registrar desabilitado.
4. **Alerta de estoque baixo** quando `quantidadeMil <= estoqueMinimoMil`. Com estoque mínimo zero, o produto só entra em alerta ao zerar.
5. **Nome obrigatório e único**, comparado sem diferenciar maiúsculas e ignorando espaços nas pontas.
6. **Preço, quantidade e estoque mínimo nunca negativos.** Quantidade de movimentação sempre maior que zero.
7. **Movimentações são imutáveis.** Não há edição nem exclusão de movimentação; o erro é corrigido com uma nova.
8. **Excluir produto** pede confirmação, informando quantas movimentações serão apagadas junto, e remove o produto e seu histórico.
9. **A unidade não muda depois da criação**, para o histórico não misturar unidades.

## 7. Telas

Três abas fixas no rodapé: **Produtos**, **Histórico**, **Backup**. Sem roteador: a aba ativa é estado da aplicação.

### 7.1 Produtos (tela inicial)

```
Estoque
[ 24 produtos ] [ 3 em alerta ] [ R$ 4.812 em estoque ]
[ Buscar produto…                                    ]
( Todos ) ( Estoque baixo (3) )
Arroz 5 kg  [baixo]                    2      [−] [+]
Mercearia · R$ 28,90                 mín. 5
Feijão carioca 1 kg                   18      [−] [+]
Mercearia · R$ 8,50                  mín. 6
                                   [ + Novo produto ]
[ Produtos ]   [ Histórico ]   [ Backup ]
```

- Resumo: total de produtos, quantidade em alerta, valor total em estoque (soma de preço × quantidade).
- Busca por nome ou categoria, sem diferenciar maiúsculas nem acentos.
- Filtro "Todos" / "Estoque baixo (n)". Tocar no cartão "em alerta" do resumo ativa o mesmo filtro.
- Ordenação: alfabética por nome.
- Linha em alerta: etiqueta de texto "baixo" e quantidade em cor de aviso. O alerta nunca depende só de cor.
- `−` abre a folha de saída; `+` abre a folha de entrada. `−` fica desabilitado com saldo zero.
- Tocar no nome abre o formulário de edição.
- Lista vazia: mensagem "Nenhum produto cadastrado" e o botão de novo produto em destaque. Busca sem resultado: "Nenhum produto encontrado".

### 7.2 Formulário de produto (novo e edição)

Campos: nome, categoria, preço, unidade, quantidade inicial, estoque mínimo.

- Na edição, unidade e quantidade aparecem somente para leitura, com o texto "Para alterar a quantidade, registre uma entrada ou saída".
- Na edição há o botão "Excluir produto".
- Erros aparecem junto do campo, ao tentar salvar.
- Teclado numérico nos campos de número (`inputmode="decimal"`); aceita vírgula como separador decimal.

### 7.3 Folha de movimentação

Abre sobre a lista. Mostra o produto e o saldo atual.

- Entrada: quantidade, observação opcional.
- Saída: quantidade, motivo (Venda pré-selecionado, Perda, Ajuste), observação opcional.
- Ao registrar, a folha fecha e a lista mostra o saldo novo.

### 7.4 Histórico

- Movimentações da mais recente para a mais antiga: tipo, produto, quantidade com sinal, motivo, observação, data e hora, saldo após.
- Filtros: por produto e por tipo (todas, entradas, saídas).
- Carrega 50 por vez, com botão "Mostrar mais".

### 7.5 Backup

- **Exportar backup**: baixa `estoque-backup-AAAA-MM-DD.json` com todo o conteúdo de `Dados` e grava `ultimoBackupEm`.
- **Importar backup**: escolhe um arquivo, valida, mostra quantos produtos e movimentações ele contém e pede confirmação antes de **substituir** os dados atuais.
- **Exportar planilha**: baixa `estoque-AAAA-MM-DD.csv` com a lista de produtos.
- Mostra "Último backup: há N dias" ou "Nenhum backup feito ainda".
- Texto fixo explicando que os dados ficam só neste aparelho e neste navegador.

### 7.6 Aparência

**[Proposta]** Visual sóbrio e neutro, sem biblioteca de componentes: CSS próprio, fonte do sistema, uma cor de aviso para estoque baixo e uma de erro. Desenhado primeiro para celular (coluna única, alvos de toque de pelo menos 44 px) e funcional no computador, com a mesma coluna centralizada. Tema claro apenas.

## 8. Armazenamento, backup e CSV

- **[Proposta] `localStorage`**, uma única chave `controle-estoque:v1` com o objeto `Dados` em JSON. Suficiente para centenas de produtos e alguns milhares de movimentações (limite prático em torno de 5 MB).
- Cada alteração grava o objeto inteiro. Se a gravação falhar (armazenamento cheio ou bloqueado), a operação é desfeita na tela e aparece uma mensagem pedindo para exportar um backup.
- Se o conteúdo salvo estiver ilegível ao abrir o app, ele não é sobrescrito: o app mostra o erro e oferece baixar o conteúdo bruto antes de começar do zero.
- O campo `versao` existe para que uma mudança futura de formato possa migrar dados antigos.
- **Importação**: valida estrutura, tipos, valores não negativos, nomes únicos e que toda movimentação aponta para um produto existente. Arquivo inválido é recusado com mensagem e os dados atuais ficam intactos.
- **CSV**: separador `;`, vírgula decimal, codificação UTF-8 com BOM, para abrir direto no Excel em português. Colunas: nome, categoria, unidade, quantidade, estoque mínimo, preço, valor em estoque, situação (ok ou baixo).

## 9. Arquitetura

```
src/
  dominio/         tipos, regras de estoque, validação, conversão de números. Funções puras, sem React.
  armazenamento/   leitura e gravação no localStorage, backup JSON, exportação CSV.
  telas/           Produtos, Historico, Backup.
  componentes/     formulário de produto, folha de movimentação, resumo, abas.
  App.tsx          estado da aplicação e aba ativa.
```

- **A regra de estoque vive em `dominio/`.** As telas chamam funções como `registrarSaida(dados, produtoId, quantidade, motivo)` que devolvem os novos dados ou um erro. Nenhuma tela calcula saldo.
- **Estado**: `useReducer` em `App.tsx` sobre o objeto `Dados`, gravado no `localStorage` a cada mudança. Sem biblioteca de estado.
- **PWA**: `vite-plugin-pwa` gera o manifesto e o service worker que guarda os arquivos do app para uso offline.
- **Dependências de produção**: `react`, `react-dom`. De desenvolvimento: `vite`, `typescript`, `vitest`, `@testing-library/react`, `vite-plugin-pwa`.
- **[Proposta] Hospedagem**: site estático na Vercel, plano gratuito. A publicação é um passo separado, feito só com autorização explícita.

## 10. Testes

Automatizados com Vitest, concentrados em `dominio/` e `armazenamento/`. Cobrem os quatro testes previstos no slide 7 e as regras da seção 6:

| Previsto no slide 7 | Casos |
|---|---|
| Cadastro válido e validação de campos | produto válido; nome vazio; nome duplicado com caixa diferente; preço negativo; decimal em unidade "un" |
| Entrada e saída de mercadorias | entrada soma; saída subtrai; estoque inicial gera movimentação; saldo = entradas − saídas |
| Bloqueio de saldo negativo | saída maior que o saldo é recusada e não altera dados; saída igual ao saldo zera |
| Alerta de estoque baixo | abaixo do mínimo; igual ao mínimo; acima; mínimo zero |

Mais: conversão de "1,5" para milésimos e de volta; exportar e importar preserva os dados; importação de arquivo inválido é recusada sem alterar nada; CSV com acento e vírgula decimal; exclusão de produto remove o histórico.

Testes de tela com Testing Library para dois fluxos: cadastrar um produto e registrar uma saída bloqueada.

O resultado da execução (`vitest run`) é guardado como evidência para o relatório.

## 11. Validação com o público-alvo

Entregáveis em `docs/validacao/`, preparados junto com o app e preenchidos **somente depois** da demonstração real:

- **Roteiro de demonstração**: cadastrar três produtos, registrar entrada, registrar saída, tentar saída maior que o saldo, ver o alerta, exportar backup.
- **Roteiro de teste manual**: os mesmos passos com resultado esperado e campo para o resultado obtido.
- **Ficha de levantamento**: perguntas para confirmar as suposições (tipo de comércio, unidades usadas, aparelho, como controla hoje).
- **Ficha de feedback**: o que o comerciante achou fácil, difícil e o que faltou.
- **Registro de ajustes**: o que mudou no app por causa do feedback.

## 12. Suposições a confirmar no levantamento

| Suposição | Se estiver errada |
|---|---|
| O comerciante usa celular no balcão | Rever prioridade do layout para computador |
| Unidades un, kg e L bastam | Acrescentar unidades à lista |
| Motivo da saída (venda, perda, ajuste) é útil | Remover o campo ou trocar as opções |
| Backup manual em arquivo é aceitável | Lembrete mais insistente, ou reabrir a discussão de nuvem |
| Um aparelho só, uma pessoa só | Fora do escopo desta versão; registrar como próximo passo |

## 13. Divergências em relação ao pptx

O pptx precisa ser atualizado depois da construção, para não contradizer o app:

- Slide 3: o cadastro passa a incluir preço e unidade.
- Slide 6: a limitação deixa de ser "sem backup"; passa a ser "backup manual em arquivo, sem login, nuvem ou integração com vendas". Acrescentar histórico de movimentações às funcionalidades.
- Slide 6: "arquivo HTML" passa a ser "aplicação web acessada por link".

## 14. Skills por fase

| Fase | Skills |
|---|---|
| Plano | `superpowers:writing-plans` |
| Construção | `superpowers:test-driven-development`, `superpowers:executing-plans`, `superpowers:verification-before-completion` |
| Interface | `minimalist-ui`, `mobile-native`, `emil-design-eng` |
| Qualidade | `engineering:testing-strategy`, `code-review` |
| Publicação | `vercel:deploy` |
| Entregáveis acadêmicos | `anthropic-skills:pptx`, `anthropic-skills:docx`, `engineering:documentation` |

## 15. Deixado para quem constrói

- Nomes exatos de arquivos, componentes e funções dentro da estrutura da seção 9.
- Valores de cor, espaçamento e tipografia, respeitando a seção 7.6.
- Ícone e nome curto do app instalado.
- Textos de mensagens não citados literalmente aqui, mantendo o tom direto e em português.
- Ordem de construção das telas.
