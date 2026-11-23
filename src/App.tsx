import { useState } from 'react';
import { baixarArquivo } from './armazenamento/baixar';
import { Abas, type Aba } from './componentes/Abas';
import { FolhaMovimentacao } from './componentes/FolhaMovimentacao';
import { FormularioProduto } from './componentes/FormularioProduto';
import type { Produto } from './dominio/tipos';
import { Backup } from './telas/Backup';
import { Historico } from './telas/Historico';
import { Produtos } from './telas/Produtos';
import { useDados } from './useDados';

type Dialogo =
  | { tipo: 'produto'; produtoId: string | null }
  | { tipo: 'movimentacao'; produtoId: string; movimento: 'entrada' | 'saida' }
  | null;

export default function App() {
  const [aba, setAba] = useState<Aba>('produtos');
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const { dados, aplicar, erroCarga, erroGravacao, descartarCorrompido } = useDados();
  const fechar = () => setDialogo(null);
  const produtoDoDialogo: Produto | null =
    dialogo === null ? null : (dados.produtos.find((p) => p.id === dialogo.produtoId) ?? null);

  if (erroCarga !== null) {
    const recomecar = () => {
      if (window.confirm('Começar do zero apaga os dados ilegíveis ao salvar o primeiro registro. Continuar?')) {
        descartarCorrompido();
      }
    };
    return (
      <div className="app">
        <header className="app-cabecalho">
          <h1>Estoque</h1>
        </header>
        <main className="app-conteudo recuperacao">
          <p className="recuperacao-titulo">Os dados salvos estão ilegíveis.</p>
          <p>Baixe uma cópia antes de recomeçar, para tentar recuperar depois.</p>
          <button type="button" className="botao" onClick={() => baixarArquivo('controle-estoque-bruto.txt', erroCarga, 'text/plain')}>
            Baixar dados brutos
          </button>
          <button type="button" className="botao botao-primario" onClick={recomecar}>
            Começar do zero
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-cabecalho">
        <h1>Estoque</h1>
      </header>
      {erroGravacao && (
        <div className="app-faixa" role="alert">
          Não foi possível salvar. Exporte um backup na aba Backup.
        </div>
      )}
      <main className="app-conteudo">
        {aba === 'produtos' && (
          <Produtos
            dados={dados} 
            aoNovo={() => setDialogo({ tipo: 'produto', produtoId: null })}
            aoEditar={(p) => setDialogo({ tipo: 'produto', produtoId: p.id })}
            aoMovimentar={(p, movimento) => setDialogo({ tipo: 'movimentacao', produtoId: p.id, movimento })}
          />
        )}
        {aba === 'historico' && <Historico dados={dados} />}
        {aba === 'backup' && <Backup dados={dados} aoAplicar={aplicar} />}
      </main>
      {dialogo?.tipo === 'produto' && (dialogo.produtoId === null || produtoDoDialogo) && (
        <FormularioProduto dados={dados} produto={produtoDoDialogo} aoAplicar={aplicar} aoFechar={fechar} />
      )}
      {dialogo?.tipo === 'movimentacao' && produtoDoDialogo && (
        <FolhaMovimentacao
          dados={dados}
          produto={produtoDoDialogo}
          tipo={dialogo.movimento}
          aoAplicar={aplicar}
          aoFechar={fechar}
        />
      )}
      <Abas ativa={aba} aoMudar={setAba} />
    </div>
  );
}
