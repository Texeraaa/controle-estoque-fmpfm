import { useId, useState, type FormEvent } from 'react';
import { registrarEntrada, registrarSaida } from '../dominio/estoque';
import { formatarQuantidade, parseQuantidade } from '../dominio/numeros';
import type { Dados, MotivoSaida, Produto } from '../dominio/tipos';
import { useDialogo } from './useDialogo';

interface Props {
  dados: Dados;
  produto: Produto;
  tipo: 'entrada' | 'saida';
  aoAplicar: (novos: Dados) => boolean;
  aoFechar: () => void;
}

const MOTIVOS: { valor: MotivoSaida; rotulo: string }[] = [
  { valor: 'venda', rotulo: 'Venda' },
  { valor: 'perda', rotulo: 'Perda' },
  { valor: 'ajuste', rotulo: 'Ajuste' },
];

export function FolhaMovimentacao({ dados, produto, tipo, aoAplicar, aoFechar }: Props) {
  const ref = useDialogo(aoFechar);
  const id = useId();
  const saida = tipo === 'saida';
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState<MotivoSaida>('venda');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');

  const mil = parseQuantidade(quantidade, produto.unidade);
  const saldo = formatarQuantidade(produto.quantidadeMil, produto.unidade);
  const excede = saida && mil !== null && mil > produto.quantidadeMil;

  const registrar = (e: FormEvent) => {
    e.preventDefault();
    if (excede) return;
    if (mil === null) {
      setErro(
        quantidade.trim() !== '' && produto.unidade === 'un' && parseQuantidade(quantidade, 'kg') !== null
          ? 'Para unidade "un", use números inteiros.'
          : 'Informe um valor válido.',
      );
      return;
    }
    const r = saida
      ? registrarSaida(dados, produto.id, mil, motivo, observacao)
      : registrarEntrada(dados, produto.id, mil, observacao);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    if (aoAplicar(r.valor)) aoFechar();
  };

  const mensagem = excede ? `Saída maior que o saldo. Disponível: ${saldo}.` : erro;

  return (
    <dialog ref={ref} className="dialogo dialogo-folha" aria-labelledby={`${id}-titulo`}>
      <form className="dialogo-corpo" onSubmit={registrar} noValidate>
        <h2 id={`${id}-titulo`} className="dialogo-titulo">
          {saida ? 'Saída' : 'Entrada'} · {produto.nome}
        </h2>
        <p className="folha-saldo">Saldo atual: {saldo}</p>

        <div className="campo">
          <label htmlFor={`${id}-quantidade`}>Quantidade</label>
          <input
            id={`${id}-quantidade`}
            value={quantidade}
            inputMode="decimal"
            data-foco
            autoComplete="off"
            onChange={(e) => {
              setQuantidade(e.target.value);
              setErro('');
            }}
            aria-invalid={mensagem ? true : undefined}
            aria-describedby={mensagem ? `${id}-erro` : undefined}
          />
          {mensagem && (
            <p className="campo-erro" id={`${id}-erro`} role="alert">
              {mensagem}
            </p>
          )}
        </div>

        {saida && (
          <fieldset className="campo motivos">
            <legend>Motivo</legend>
            <div className="motivos-grupo">
              {MOTIVOS.map((m) => (
                <label key={m.valor} className="motivo">
                  <input
                    type="radio"
                    name={`${id}-motivo`}
                    value={m.valor}
                    checked={motivo === m.valor}
                    onChange={() => setMotivo(m.valor)}
                  />
                  <span>{m.rotulo}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="campo">
          <label htmlFor={`${id}-obs`}>Observação (opcional)</label>
          <input
            id={`${id}-obs`}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            autoComplete="off"
            enterKeyHint="done"
          />
        </div>

        <div className="dialogo-acoes">
          <button type="submit" className="botao botao-primario" disabled={excede}>
            {saida ? 'Registrar saída' : 'Registrar entrada'}
          </button>
          <button type="button" className="botao" onClick={aoFechar}>
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  );
}
