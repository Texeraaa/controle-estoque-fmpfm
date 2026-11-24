Situação: não preenchido — preencher somente após a atividade real.

# Roteiro de teste manual

Os mesmos passos da demonstração, com o resultado esperado. As colunas "Resultado obtido" e "Data" ficam em branco até alguém executar o passo de verdade.

| Passo | Ação | Resultado esperado | Resultado obtido | Data |
|---|---|---|---|---|
| 1 | Aba **Produtos**, lista vazia | Aparece "Nenhum produto cadastrado" e o botão **Novo produto** em destaque | | |
| 2 | Tocar em **Novo produto**, deixar o nome em branco e tocar em **Salvar** | O formulário continua aberto e mostra o erro junto do campo nome | | |
| 3 | Cadastrar o primeiro produto com todos os campos válidos e tocar em **Salvar** | O formulário fecha e o produto aparece na lista com o saldo e o mínimo informados | | |
| 4 | Cadastrar o segundo produto, com unidade `kg` e quantidade `1,5` | O produto aparece com saldo 1,5 kg | | |
| 5 | Cadastrar o terceiro produto, com estoque mínimo maior que a quantidade inicial | O produto aparece com a etiqueta **baixo** | | |
| 6 | Tentar cadastrar um produto com o mesmo nome de outro, mudando só maiúsculas e minúsculas | O cadastro é recusado e o formulário continua aberto | | |
| 7 | Tentar cadastrar produto com unidade `un` e quantidade `1,5` | O aplicativo pede números inteiros e não cadastra | | |
| 8 | Tocar em **+** em um produto, digitar uma quantidade e tocar em **Registrar entrada** | O saldo na lista sobe pela quantidade digitada | | |
| 9 | Tocar em **−** em um produto, digitar uma quantidade menor que o saldo, manter o motivo **Venda** e tocar em **Registrar saída** | O saldo na lista desce pela quantidade digitada | | |
| 10 | Tocar em **−** e digitar uma quantidade maior que o saldo | Aparece "Saída maior que o saldo. Disponível: ..." e **Registrar saída** fica desabilitado | | |
| 11 | Tocar em **Cancelar** depois do passo 10 | A folha fecha e o saldo continua o mesmo | | |
| 12 | Registrar uma saída igual ao saldo inteiro | O saldo vai a zero, o produto ganha a etiqueta **baixo** e o botão **−** fica desabilitado | | |
| 13 | Tocar no botão **Estoque baixo (N)** (N é o número de produtos com estoque baixo) | Só os produtos com a etiqueta **baixo** aparecem | | |
| 14 | Tocar em **Todos** | Todos os produtos voltam à lista | | |
| 15 | Digitar parte do nome de um produto no campo de busca | Só os produtos que combinam aparecem; sem resultado, aparece "Nenhum produto encontrado" | | |
| 16 | Tocar no nome de um produto | Abre **Editar produto**, com unidade e quantidade somente para leitura e o texto "Para alterar a quantidade, registre uma entrada ou saída." | | |
| 17 | Aba **Histórico** | As movimentações aparecem da mais recente para a mais antiga, com tipo, produto, quantidade, data, hora e saldo | | |
| 18 | No **Histórico**, filtrar por produto e por tipo | Só as movimentações escolhidas aparecem | | |
| 19 | Aba **Backup**, tocar em **Exportar backup** | O aparelho baixa um arquivo `estoque-backup-AAAA-MM-DD.json` e aparece "Último backup: hoje" | | |
| 20 | Tocar em **Exportar planilha (CSV)** | O aparelho baixa um arquivo `.csv` que abre numa planilha | | |
| 21 | Excluir um produto em **Editar produto** > **Excluir produto** | Aparece uma confirmação com o número de movimentações que serão apagadas; ao confirmar, o produto some | | |
| 22 | **Importar backup** com o arquivo do passo 19 | Aparece quantos produtos e movimentações o arquivo tem; ao tocar em **Substituir dados**, os dados voltam como estavam no backup | | |
| 23 | **Importar backup** com um arquivo que não é um backup | Aparece uma mensagem de erro e os dados atuais continuam intactos | | |
| 24 | Fechar e reabrir o aplicativo | Os produtos e o histórico continuam lá | | |
| 25 | Colocar o aparelho em modo avião e abrir o aplicativo | O aplicativo abre e funciona sem internet (vale para a versão instalada ou já aberta antes) | | |
