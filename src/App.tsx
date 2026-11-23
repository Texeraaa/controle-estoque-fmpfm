import { useState } from 'react';
import { baixarArquivo } from './armazenamento/baixar';
import { Abas, type Aba } from './componentes/Abas';
import { Produtos } from './telas/Produtos';
import { useDados } from './useDados';

export default function App() {
  const [aba, setAba] = useState<Aba>('produtos');
  const { dados, erroCarga, erroGravacao, descartarCorrompido } = useDados();

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
        {aba === 'produtos' && <Produtos dados={dados} aoNovo={() => {}} aoEditar={() => {}} aoMovimentar={() => {}} />}
        {aba === 'historico' && <h2>Histórico</h2>}
        {aba === 'backup' && <h2>Backup</h2>}
      </main>
      <Abas ativa={aba} aoMudar={setAba} />
    </div>
  );
}
