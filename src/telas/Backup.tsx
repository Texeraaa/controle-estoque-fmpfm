import { useState } from 'react';
import { gerarBackup, lerBackup } from '../armazenamento/backup';
import { baixarArquivo } from '../armazenamento/baixar';
import { gerarCsv } from '../armazenamento/csv';
import type { Dados } from '../dominio/tipos';

interface Props {
  dados: Dados;
  aoAplicar: (novos: Dados) => boolean;
}

type Aviso = { tipo: 'erro' | 'ok'; texto: string } | null;

const plural = (n: number, singular: string, pluralTxt: string) => `${n} ${n === 1 ? singular : pluralTxt}`;

/** Dias de calendário locais entre dois instantes ISO (nunca negativo). */
function diasDesde(iso: string, agora: Date): number {
  const d = new Date(iso);
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function estadoBackup(iso: string | undefined): string {
  if (!iso) return 'Nenhum backup feito ainda';
  const dias = diasDesde(iso, new Date());
  if (dias === 0) return 'Último backup: hoje';
  return `Último backup: há ${plural(dias, 'dia', 'dias')}`;
}

function lerTexto(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsText(arquivo);
  });
}

export function Backup({ dados, aoAplicar }: Props) {
  const [pendente, setPendente] = useState<Dados | null>(null);
  const [aviso, setAviso] = useState<Aviso>(null);

  const exportar = () => {
    const r = gerarBackup(dados);
    baixarArquivo(r.nomeArquivo, r.conteudo, 'application/json');
    aoAplicar(r.dados);
  };

  const exportarCsv = () => {
    const r = gerarCsv(dados);
    baixarArquivo(r.nomeArquivo, r.conteudo, 'text/csv;charset=utf-8');
  };

  const escolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setPendente(null);
    setAviso(null);
    let texto: string;
    try {
      texto = await lerTexto(arquivo);
    } catch {
      setAviso({ tipo: 'erro', texto: 'Não foi possível ler o arquivo.' });
      return;
    }
    const r = lerBackup(texto);
    if (r.ok) setPendente(r.valor);
    else setAviso({ tipo: 'erro', texto: r.erro });
  };

  const substituir = () => {
    if (!pendente) return;
    const salvo = aoAplicar(pendente);
    setPendente(null);
    setAviso(salvo ? { tipo: 'ok', texto: 'Backup importado.' } : { tipo: 'erro', texto: 'Não foi possível salvar.' });
  };

  return (
    <section className="backup">
      <h2>Backup</h2>
      <p className="backup-texto">
        Seus dados ficam salvos apenas neste aparelho e neste navegador. Exporte um backup com frequência.
      </p>
      <p className="backup-estado">{estadoBackup(dados.ultimoBackupEm)}</p>

      <button type="button" className="botao botao-primario" onClick={exportar}>
        Exportar backup
      </button>

      <label className="botao backup-importar">
        Importar backup
        <input
          type="file"
          accept="application/json,.json"
          className="backup-arquivo"
          onChange={escolher}
        />
      </label>

      <button type="button" className="botao" onClick={exportarCsv}>
        Exportar planilha (CSV)
      </button>

      {pendente && (
        <div className="backup-confirmar">
          <p>
            Este backup tem {plural(pendente.produtos.length, 'produto', 'produtos')} e{' '}
            {plural(pendente.movimentacoes.length, 'movimentação', 'movimentações')}. Importar substitui todos os dados
            atuais.
          </p>
          <button type="button" className="botao botao-perigo" onClick={substituir}>
            Substituir dados
          </button>
          <button type="button" className="botao" onClick={() => setPendente(null)}>
            Cancelar
          </button>
        </div>
      )}

      {aviso?.tipo === 'erro' && (
        <p className="campo-erro" role="alert">
          {aviso.texto}
        </p>
      )}
      {aviso?.tipo === 'ok' && (
        <p className="backup-ok" role="status">
          {aviso.texto}
        </p>
      )}
    </section>
  );
}
