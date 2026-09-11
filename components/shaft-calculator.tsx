'use client';

import React, { useState, useMemo } from 'react';
import {
  ElevatorConfigState,
  Acionamento,
  Arcada,
  LadoArcada,
  TipoEntrada,
  TipoPorta,
  LadoInstalacaoPorta,
  calculatePossibleCabinsFromShaft,
  calculateShaftClearances,
  PossibleCabinOption,
  ACIONAMENTOS,
  ARCADAS,
  LADOS_ARCADA,
  TIPOS_ENTRADA,
  TIPOS_PORTA,
  getMaiorAberturaValida,
} from '@/lib/elevator-calculator';
import { ClearancesConfigModal } from './clearances-config-modal';
import {
  Building2,
  Box,
  Check,
  ChevronRight,
  Filter,
  Info,
  Maximize2,
  Sparkles,
  Users,
  Weight,
  DoorOpen,
  ArrowRight,
  AlertTriangle,
  Layers,
  Settings2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ShaftCalculatorProps {
  currentState: ElevatorConfigState;
  onApplyCabin: (newState: ElevatorConfigState) => void;
  onClose?: () => void;
}

export function ShaftCalculator({
  currentState,
  onApplyCabin,
  onClose,
}: ShaftCalculatorProps) {
  // Inicializa a largura e profundidade do poço sugeridas com base no estado atual ou padrão
  const [larguraPoco, setLarguraPoco] = useState<number | ''>(() => {
    const lCabine = parseInt(currentState.larguraCabine, 10) || 1000;
    // estimativa de poço padrão
    return Math.max(1400, Math.round((lCabine + 550) / 50) * 50);
  });

  const [profundidadePoco, setProfundidadePoco] = useState<number | ''>(() => {
    const pCabine = parseInt(currentState.profundidadeCabine, 10) || 1250;
    return Math.max(1500, Math.round((pCabine + 350) / 50) * 50);
  });

  // Parâmetros mecânicos (herdados do estado atual)
  const [acionamento, setAcionamento] = useState<Acionamento>(currentState.acionamento);
  const [arcada, setArcada] = useState<Arcada>(currentState.arcada);
  const [ladoArcada, setLadoArcada] = useState<LadoArcada>(currentState.ladoArcada);
  const [tipoEntrada, setTipoEntrada] = useState<TipoEntrada>(currentState.tipoEntrada);
  const [tipoPorta, setTipoPorta] = useState<TipoPorta>(currentState.tipoPorta);
  const [ladoPorta, setLadoPorta] = useState<LadoInstalacaoPorta>(currentState.ladoPorta || 'Largura');

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'accessible' | 'commercial' | 'compact'>('all');
  const [appliedCabinKey, setAppliedCabinKey] = useState<string | null>(null);

  // Executa o cálculo inverso de cabines viáveis
  const calculationResult = useMemo(() => {
    return calculatePossibleCabinsFromShaft({
      larguraPoco: larguraPoco === '' ? 0 : larguraPoco,
      profundidadePoco: profundidadePoco === '' ? 0 : profundidadePoco,
      acionamento,
      arcada,
      ladoArcada,
      tipoEntrada,
      tipoPorta,
      ladoPorta,
      customMenorFolga: currentState.customMenorFolga,
      customFolgaFrontal: currentState.customFolgaFrontal,
      customFolgaFundo: currentState.customFolgaFundo,
      baseChassisHidraulicoL: currentState.baseChassisHidraulicoL,
      baseChassisHidraulicoSuspensao: currentState.baseChassisHidraulicoSuspensao,
      baseChassisEletricoL: currentState.baseChassisEletricoL,
      baseChassisEletricoSuspensaoLateral: currentState.baseChassisEletricoSuspensaoLateral,
      baseChassisEletricoSuspensaoFundo: currentState.baseChassisEletricoSuspensaoFundo,
    });
  }, [
    larguraPoco,
    profundidadePoco,
    acionamento,
    arcada,
    ladoArcada,
    tipoEntrada,
    tipoPorta,
    ladoPorta,
    currentState.customMenorFolga,
    currentState.customFolgaFrontal,
    currentState.customFolgaFundo,
    currentState.baseChassisHidraulicoL,
    currentState.baseChassisHidraulicoSuspensao,
    currentState.baseChassisEletricoL,
    currentState.baseChassisEletricoSuspensaoLateral,
    currentState.baseChassisEletricoSuspensaoFundo,
  ]);

  // Filtra as opções de acordo com o filtro selecionado
  const filteredCabins = useMemo(() => {
    if (!calculationResult.cabinesPossiveis) return [];
    const list = calculationResult.cabinesPossiveis;

    switch (selectedFilter) {
      case 'accessible':
        return list.filter((c) => c.larguraCabine >= 1100 && c.profundidadeCabine >= 1400);
      case 'commercial':
        return list.filter((c) => c.numeroPassageiros >= 6);
      case 'compact':
        return list.filter((c) => c.larguraCabine <= 950 && c.profundidadeCabine <= 1300);
      default:
        return list;
    }
  }, [calculationResult.cabinesPossiveis, selectedFilter]);

  // Aplica a cabine selecionada ao estado global do configurador
  const handleApplyCabin = (cabin: PossibleCabinOption) => {
    // Escolhe a melhor porta viável para o lado da instalação
    const ladoFace = ladoPorta === 'Profundidade' ? cabin.profundidadeCabine : cabin.larguraCabine;
    const ladoEfetivo = tipoEntrada === 'Adjacente' ? Math.min(cabin.larguraCabine, cabin.profundidadeCabine) : ladoFace;
    const abertura = getMaiorAberturaValida(ladoEfetivo);

    const newState: ElevatorConfigState = {
      ...currentState,
      larguraCabine: cabin.larguraCabine.toString(),
      profundidadeCabine: cabin.profundidadeCabine.toString(),
      aberturaPorta: abertura,
      acionamento,
      arcada,
      ladoArcada,
      tipoEntrada,
      tipoPorta,
      ladoPorta,
    };

    onApplyCabin(newState);

    const key = `${cabin.larguraCabine}x${cabin.profundidadeCabine}`;
    setAppliedCabinKey(key);
    setTimeout(() => {
      setAppliedCabinKey(null);
    }, 2500);
  };

  // Predefinições rápidas de poço
  const shaftPresets = [
    { label: 'Poço Compacto', lp: 1450, pp: 1550, desc: 'Homelift / Residencial' },
    { label: 'Poço Comercial Médio', lp: 1600, pp: 1700, desc: '6 Passageiros Padrão' },
    { label: 'Poço Acessível (NBR 313)', lp: 1750, pp: 1850, desc: 'Cadeirante 8 Passageiros' },
    { label: 'Poço Grande / Maca', lp: 1800, pp: 2500, desc: 'Maca Hospitalar' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Banner Explicativo e Título */}
      <div className="bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-800/40 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Dimensionamento Inverso por Tamanho de Poço
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  Múltiplos de 50 mm
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Informe as medidas livres da caixa de corrida (LP × PP) para descobrir quais tamanhos de cabine cabem no local.
              </p>
            </div>
          </div>
        </div>

        {/* Regra de Ouro dos Múltiplos de 50 */}
        <div className="mt-3 pt-3 border-t border-cyan-900/40 flex items-center gap-2 text-xs text-cyan-200/90">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Garantia de Padronização:</strong> Todos os tamanhos calculados são estritamente <strong>múltiplos de 50 mm</strong> (sem números quebrados), garantindo modularidade de painéis e viabilidade de fabricação.
          </span>
        </div>
      </div>

      {/* Inputs Principais de Largura e Profundidade do Poço */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              1. Medidas da Caixa de Corrida (Poço)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Medidas em milímetros (mm)</span>
        </div>

        {/* Inputs de Largura e Profundidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Largura do Poço (LP) */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-largura-poco" className="text-xs font-semibold text-slate-300">
                Largura do Poço (LP)
              </label>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {larguraPoco} mm
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLarguraPoco((prev) => Math.max(1000, (typeof prev === 'number' ? prev : 1000) - 50))}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-bold font-mono transition-colors"
                title="Diminuir 50 mm"
              >
                -50
              </button>

              <input
                id="input-largura-poco"
                type="number"
                min={1000}
                max={4000}
                value={larguraPoco}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setLarguraPoco(val);
                }}
                className="flex-1 bg-slate-900 border border-slate-700 text-white rounded px-3 py-1.5 text-sm font-mono font-bold text-center focus:outline-none focus:border-cyan-500"
              />

              <button
                type="button"
                onClick={() => setLarguraPoco((prev) => (typeof prev === 'number' ? prev : 1000) + 50)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-bold font-mono transition-colors"
                title="Aumentar 50 mm"
              >
                +50
              </button>
            </div>

            {/* Atalhos Rápidos para LP */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500 mr-1 shrink-0">Comuns:</span>
              {[1400, 1500, 1600, 1750, 1850].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setLarguraPoco(v)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors shrink-0 ${
                    larguraPoco === v
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Profundidade do Poço (PP) */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-profundidade-poco" className="text-xs font-semibold text-slate-300">
                Profundidade do Poço (PP)
              </label>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {profundidadePoco} mm
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setProfundidadePoco((prev) => Math.max(1000, (typeof prev === 'number' ? prev : 1000) - 50))}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-bold font-mono transition-colors"
                title="Diminuir 50 mm"
              >
                -50
              </button>

              <input
                id="input-profundidade-poco"
                type="number"
                min={1000}
                max={5000}
                value={profundidadePoco}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setProfundidadePoco(val);
                }}
                className="flex-1 bg-slate-900 border border-slate-700 text-white rounded px-3 py-1.5 text-sm font-mono font-bold text-center focus:outline-none focus:border-cyan-500"
              />

              <button
                type="button"
                onClick={() => setProfundidadePoco((prev) => (typeof prev === 'number' ? prev : 1000) + 50)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-bold font-mono transition-colors"
                title="Aumentar 50 mm"
              >
                +50
              </button>
            </div>

            {/* Atalhos Rápidos para PP */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500 mr-1 shrink-0">Comuns:</span>
              {[1500, 1600, 1700, 1850, 2400].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setProfundidadePoco(v)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors shrink-0 ${
                    profundidadePoco === v
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modelos Predefinidos de Poço */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">
            Ou escolha um Poço Típico de Mercado:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {shaftPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setLarguraPoco(preset.lp);
                  setProfundidadePoco(preset.pp);
                }}
                className={`p-2 rounded-lg border text-left transition-all ${
                  larguraPoco === preset.lp && profundidadePoco === preset.pp
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                    : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-mono">
                  {preset.lp} × {preset.pp} mm
                </div>
                <div className="text-[10px] text-slate-400 truncate">{preset.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Configurações Mecânicas do Poço (influenciam folgas e chassi) */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ajustar Sistema Mecânico do Poço (Tração, Guias e Arcada)</span>
              {showAdvancedSettings ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </button>
          </div>

          {showAdvancedSettings && (
            <div className="mt-3 p-3 bg-slate-950/80 rounded-lg border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Acionamento */}
                <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">
                  Acionamento
                </label>
                <select
                  value={acionamento}
                  onChange={(e) => setAcionamento(e.target.value as Acionamento)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
                >
                  {ACIONAMENTOS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lado da Arcada */}
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">
                  Posição do Chassis
                </label>
                <select
                  value={ladoArcada}
                  onChange={(e) => setLadoArcada(e.target.value as LadoArcada)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
                >
                  {LADOS_ARCADA.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Arcada */}
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">
                  Tipo de Arcada
                </label>
                <select
                  value={arcada}
                  onChange={(e) => setArcada(e.target.value as Arcada)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
                >
                  {ARCADAS.map((a) => (
                    <option key={a} value={a}>
                      {a === 'L' ? 'Arcada L (Mochila)' : 'Arcada Suspensão'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Entrada */}
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">
                  Entradas do Pavimento
                </label>
                <select
                  value={tipoEntrada}
                  onChange={(e) => setTipoEntrada(e.target.value as TipoEntrada)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
                >
                  {TIPOS_ENTRADA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de Poço Insuficiente */}
      {calculationResult.isPocoInsuficiente && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Dimensões de Poço Reduzidas
            </h4>
            <p className="text-xs text-amber-200/90 mt-1">
              {calculationResult.motivoInsuficiente}
            </p>
            <p className="text-xs text-amber-300 mt-2 font-medium">
              💡 Dica: Aumente a largura para pelo menos 1350 mm e a profundidade para pelo menos 1400 mm para viabilizar a cabine.
            </p>
          </div>
        </div>
      )}

      {/* Card da Cabine Máxima Possível (Hero Result) */}
      {calculationResult.cabineMaxima && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border-2 border-emerald-500/60 rounded-xl p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded-md uppercase tracking-wider">
                  Cabine de Máximo Aproveitamento
                </span>
                <span className="text-xs text-emerald-300 font-semibold">
                  Múltiplo estrito de 50 mm
                </span>
              </div>
              <h3 className="text-2xl font-black text-white font-mono mt-1">
                {calculationResult.cabineMaxima.larguraCabine} × {calculationResult.cabineMaxima.profundidadeCabine} mm
              </h3>
            </div>

            <button
              id="btn-apply-max-cabin"
              type="button"
              onClick={() => handleApplyCabin(calculationResult.cabineMaxima!)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer shrink-0"
            >
              {appliedCabinKey ===
              `${calculationResult.cabineMaxima.larguraCabine}x${calculationResult.cabineMaxima.profundidadeCabine}` ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Cabine Aplicada com Sucesso!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Aplicar Cabine Máxima ao Projeto</span>
                </>
              )}
            </button>
          </div>

          {/* Grid de Métricas da Cabine Máxima */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-emerald-900/40">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-emerald-900/30">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                Lotação NBR 16858-1
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">
                  {calculationResult.cabineMaxima.numeroPassageiros} Passageiros
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-emerald-900/30">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                Carga Útil
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Weight className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300">
                  {calculationResult.cabineMaxima.cargaUtilKg} kg
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-emerald-900/30">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                Área Útil da Cabine
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-cyan-300">
                  {calculationResult.cabineMaxima.areaCabineM2.toFixed(2)} m²
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-emerald-900/30">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                Vão Livre de Porta
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <DoorOpen className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-bold text-sky-300">
                  {calculationResult.cabineMaxima.maxAberturaPorta} mm
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 text-[11px] text-emerald-200/70 flex items-center justify-between">
            <span>
              Sobra de folga na largura: <strong>{calculationResult.cabineMaxima.sobraLarguraPoco} mm</strong> | Sobra na profundidade: <strong>{calculationResult.cabineMaxima.sobraProfundidadePoco} mm</strong>
            </span>
            <span className="font-mono text-emerald-400">
              Poço mín. exigido: {calculationResult.cabineMaxima.larguraPocoMinima} × {calculationResult.cabineMaxima.profundidadePocoMinima} mm
            </span>
          </div>
        </div>
      )}

      {/* Lista de Todos os Tamanhos de Cabine Possíveis */}
      {calculationResult.cabinesPossiveis.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  2. Todas as Opções de Cabine Possíveis ({filteredCabins.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Selecione qualquer combinação para aplicar ao desenho técnico e cálculo normativo.
              </p>
            </div>

            {/* Filtros Rápidos */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({calculationResult.cabinesPossiveis.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('accessible')}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedFilter === 'accessible'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Acessibilidade NBR 313
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('commercial')}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedFilter === 'commercial'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ≥ 6 Passageiros
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('compact')}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedFilter === 'compact'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Compactas
              </button>
            </div>
          </div>

          {/* Grid de Cards de Cabines Viáveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredCabins.map((cabin) => {
              const isApplied =
                appliedCabinKey === `${cabin.larguraCabine}x${cabin.profundidadeCabine}` ||
                (currentState.larguraCabine === cabin.larguraCabine.toString() &&
                  currentState.profundidadeCabine === cabin.profundidadeCabine.toString());

              return (
                <div
                  key={`${cabin.larguraCabine}x${cabin.profundidadeCabine}`}
                  className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                    isApplied
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-sm'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/30'
                  }`}
                >
                  <div>
                    {/* Header do Card com Tags */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-white font-mono">
                          {cabin.larguraCabine} × {cabin.profundidadeCabine} mm
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({cabin.proporcao})
                        </span>
                      </div>

                      {cabin.tag && (
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                            cabin.tag.includes('Máximo')
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : cabin.tag.includes('Acessibilidade')
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {cabin.tag}
                        </span>
                      )}
                    </div>

                    {/* Especificações Técnicas */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 my-2 pt-2 border-t border-slate-800/70">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Lotação</span>
                        <span className="font-semibold text-emerald-400">
                          {cabin.numeroPassageiros} pass. ({cabin.cargaUtilKg} kg)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Área Útil</span>
                        <span className="font-semibold text-cyan-400">
                          {cabin.areaCabineM2.toFixed(2)} m²
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Porta Máx.</span>
                        <span className="font-semibold text-sky-400">
                          {cabin.maxAberturaPorta} mm
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>Poço mín: {cabin.larguraPocoMinima} × {cabin.profundidadePocoMinima} mm</span>
                      <span className="text-slate-500">
                        Sobra: +{cabin.sobraLarguraPoco} / +{cabin.sobraProfundidadePoco} mm
                      </span>
                    </div>
                  </div>

                  {/* Botão Aplicar */}
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Múltiplo de 50 mm garantido
                    </span>

                    <button
                      type="button"
                      onClick={() => handleApplyCabin(cabin)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Selecionada</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Aplicar Cabine</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
