'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ElevatorConfigState,
  ShaftConfigState,
  Acionamento,
  Arcada,
  LadoArcada,
  TipoEntrada,
  TipoPorta,
  LadoInstalacaoPorta,
  calculatePossibleCabinsFromShaft,
  PossibleCabinOption,
  ACIONAMENTOS,
  ARCADAS,
  LADOS_ARCADA,
  TIPOS_ENTRADA,
  TIPOS_PORTA,
  LADOS_INSTALACAO_PORTA,
  ABERTURAS_PORTA,
  getMaiorAberturaValida,
} from '@/lib/elevator-calculator';
import {
  Building2,
  Box,
  Check,
  Maximize2,
  Sparkles,
  Users,
  Weight,
  DoorOpen,
  AlertTriangle,
  Layers,
  Settings2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

export interface ShaftCalculatorProps {
  shaftConfig: ShaftConfigState;
  onChange: (newConfig: ShaftConfigState) => void;
  customClearances?: Partial<ElevatorConfigState>;
  onClose?: () => void;
  // Fallback opcional para compatibilidade
  currentState?: ElevatorConfigState;
  onApplyCabin?: (newState: ElevatorConfigState) => void;
}

export function ShaftCalculator({
  shaftConfig,
  onChange,
  customClearances,
}: ShaftCalculatorProps) {
  // Inputs locais controlados para digitação fluida
  const [prevLp, setPrevLp] = useState(shaftConfig.larguraPoco);
  const [prevPp, setPrevPp] = useState(shaftConfig.profundidadePoco);
  const [localLp, setLocalLp] = useState<string>(shaftConfig.larguraPoco.toString());
  const [localPp, setLocalPp] = useState<string>(shaftConfig.profundidadePoco.toString());
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isAlternativeCabinsOpen, setIsAlternativeCabinsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'accessible' | 'commercial' | 'compact'>('all');

  if (shaftConfig.larguraPoco !== prevLp) {
    setPrevLp(shaftConfig.larguraPoco);
    setLocalLp(shaftConfig.larguraPoco.toString());
  }

  if (shaftConfig.profundidadePoco !== prevPp) {
    setPrevPp(shaftConfig.profundidadePoco);
    setLocalPp(shaftConfig.profundidadePoco.toString());
  }

  // Executa o cálculo inverso de cabines viáveis estritamente a partir do poço informado
  const calculationResult = useMemo(() => {
    return calculatePossibleCabinsFromShaft({
      larguraPoco: shaftConfig.larguraPoco,
      profundidadePoco: shaftConfig.profundidadePoco,
      acionamento: shaftConfig.acionamento,
      arcada: shaftConfig.arcada,
      ladoArcada: shaftConfig.ladoArcada,
      tipoEntrada: shaftConfig.tipoEntrada,
      tipoPorta: shaftConfig.tipoPorta,
      ladoPorta: shaftConfig.ladoPorta,
      customMenorFolga: customClearances?.customMenorFolga,
      customFolgaFrontal: customClearances?.customFolgaFrontal,
      customFolgaFundo: customClearances?.customFolgaFundo,
      baseChassisHidraulicoL: customClearances?.baseChassisHidraulicoL,
      baseChassisHidraulicoSuspensao: customClearances?.baseChassisHidraulicoSuspensao,
      baseChassisEletricoL: customClearances?.baseChassisEletricoL,
      baseChassisEletricoSuspensaoLateral: customClearances?.baseChassisEletricoSuspensaoLateral,
      baseChassisEletricoSuspensaoFundo: customClearances?.baseChassisEletricoSuspensaoFundo,
    });
  }, [shaftConfig, customClearances]);

  // Cabine ativa selecionada (ou a máxima padrão calculada para o poço)
  const activeCabin: PossibleCabinOption | null = useMemo(() => {
    if (shaftConfig.selectedCabinKey && calculationResult.cabinesPossiveis.length > 0) {
      const found = calculationResult.cabinesPossiveis.find(
        (c) => `${c.larguraCabine}x${c.profundidadeCabine}` === shaftConfig.selectedCabinKey
      );
      if (found) return found;
    }
    return calculationResult.cabineMaxima;
  }, [shaftConfig.selectedCabinKey, calculationResult]);

  // Dimensões da cabine ativa e geometria de portas
  const activeLargura = activeCabin?.larguraCabine ?? 800;
  const activeProfundidade = activeCabin?.profundidadeCabine ?? 1200;
  const isDoorOnDepth = (shaftConfig.ladoPorta || 'Largura') === 'Profundidade';
  const activeFaceMm = isDoorOnDepth ? activeProfundidade : activeLargura;
  const ladoEfetivo =
    shaftConfig.tipoEntrada === 'Adjacente'
      ? Math.min(activeLargura, activeProfundidade)
      : activeFaceMm;

  const maxAberturaValida = activeCabin?.maxAberturaPorta || getMaiorAberturaValida(ladoEfetivo);

  // Tamanho de porta ativo (respeita a escolha do usuário se couber na face, senão usa a máxima válida)
  const currentAbertura = useMemo(() => {
    if (shaftConfig.aberturaPorta) {
      const parsed = parseInt(shaftConfig.aberturaPorta, 10);
      if (!isNaN(parsed) && parsed < ladoEfetivo) {
        return shaftConfig.aberturaPorta;
      }
    }
    return maxAberturaValida;
  }, [shaftConfig.aberturaPorta, ladoEfetivo, maxAberturaValida]);

  const aberturaNum = parseInt(currentAbertura, 10) || 700;
  const sobraMm = Math.max(0, ladoEfetivo - aberturaNum);
  const montanteMm = Math.max(0, Math.round(sobraMm / 2));

  // Handler para alterar o tamanho da porta
  const handleAberturaChange = (val: string) => {
    onChange({
      ...shaftConfig,
      aberturaPorta: val,
    });
  };

  // Handler para selecionar outra cabine mantendo/ajustando a porta adequadamente
  const handleSelectCabin = (cabin: PossibleCabinOption) => {
    const cabinKey = `${cabin.larguraCabine}x${cabin.profundidadeCabine}`;
    const cabinFace =
      (shaftConfig.ladoPorta || 'Largura') === 'Profundidade'
        ? cabin.profundidadeCabine
        : cabin.larguraCabine;
    const cabinLadoEfetivo =
      shaftConfig.tipoEntrada === 'Adjacente'
        ? Math.min(cabin.larguraCabine, cabin.profundidadeCabine)
        : cabinFace;

    let newAbertura = shaftConfig.aberturaPorta || currentAbertura;
    const parsed = parseInt(newAbertura, 10);
    if (isNaN(parsed) || parsed >= cabinLadoEfetivo) {
      newAbertura = cabin.maxAberturaPorta || getMaiorAberturaValida(cabinLadoEfetivo);
    }

    onChange({
      ...shaftConfig,
      selectedCabinKey: cabinKey,
      aberturaPorta: newAbertura,
    });
  };

  // Handler para restaurar para a cabine de máximo aproveitamento
  const handleResetToMax = () => {
    const maxCab = calculationResult.cabineMaxima;
    let newAbertura = shaftConfig.aberturaPorta || currentAbertura;
    if (maxCab) {
      const maxFace =
        (shaftConfig.ladoPorta || 'Largura') === 'Profundidade'
          ? maxCab.profundidadeCabine
          : maxCab.larguraCabine;
      const maxLadoEfetivo =
        shaftConfig.tipoEntrada === 'Adjacente'
          ? Math.min(maxCab.larguraCabine, maxCab.profundidadeCabine)
          : maxFace;
      const parsed = parseInt(newAbertura, 10);
      if (isNaN(parsed) || parsed >= maxLadoEfetivo) {
        newAbertura = maxCab.maxAberturaPorta || getMaiorAberturaValida(maxLadoEfetivo);
      }
    }
    onChange({
      ...shaftConfig,
      selectedCabinKey: null,
      aberturaPorta: newAbertura,
    });
  };

  // Filtra as opções viáveis
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

  // Handlers para Largura do Poço (LP)
  const handleLpChange = (text: string) => {
    setLocalLp(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 600 && num <= 5000) {
      onChange({
        ...shaftConfig,
        larguraPoco: num,
        selectedCabinKey: null,
      });
    }
  };

  const handleLpStep = (delta: number) => {
    const current = shaftConfig.larguraPoco || 1600;
    const nextVal = Math.max(600, Math.min(5000, current + delta));
    setLocalLp(nextVal.toString());
    onChange({
      ...shaftConfig,
      larguraPoco: nextVal,
      selectedCabinKey: null,
    });
  };

  // Handlers para Profundidade do Poço (PP)
  const handlePpChange = (text: string) => {
    setLocalPp(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 600 && num <= 5000) {
      onChange({
        ...shaftConfig,
        profundidadePoco: num,
        selectedCabinKey: null,
      });
    }
  };

  const handlePpStep = (delta: number) => {
    const current = shaftConfig.profundidadePoco || 1700;
    const nextVal = Math.max(600, Math.min(5000, current + delta));
    setLocalPp(nextVal.toString());
    onChange({
      ...shaftConfig,
      profundidadePoco: nextVal,
      selectedCabinKey: null,
    });
  };

  // Predefinições rápidas de poço de mercado
  const shaftPresets = [
    { label: 'Poço Compacto', lp: 1450, pp: 1550, desc: 'Homelift / Residencial' },
    { label: 'Poço Médio Padrão', lp: 1600, pp: 1700, desc: '6 Passageiros Comercial' },
    { label: 'Poço Acessível (NBR 313)', lp: 1750, pp: 1850, desc: 'Cadeirante 8 Passageiros' },
    { label: 'Poço Grande / Maca', lp: 1800, pp: 2500, desc: 'Maca Hospitalar' },
  ];

  const isCurrentMax =
    !shaftConfig.selectedCabinKey ||
    (calculationResult.cabineMaxima &&
      shaftConfig.selectedCabinKey ===
        `${calculationResult.cabineMaxima.larguraCabine}x${calculationResult.cabineMaxima.profundidadeCabine}`);

  return (
    <div className="flex flex-col gap-2.5">
      {/* 1. Card Principal: Cabine Calculada Ativa para a Obra (Design Compacto de Engenharia) */}
      {activeCabin && (
        <div className="bg-slate-900/90 border border-emerald-500/50 rounded-xl p-3 shadow-sm">
          {/* Header da Cabine Calculada */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono">
                {isCurrentMax ? 'Máximo Aproveitamento' : 'Cabine Selecionada'}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                Passo 50mm
              </span>
              {activeCabin.isForaDaNorma && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-medium font-mono">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                  Sob Medida
                </span>
              )}
            </div>

            {!isCurrentMax && calculationResult.cabineMaxima && (
              <button
                type="button"
                onClick={handleResetToMax}
                className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Usar Máxima ({calculationResult.cabineMaxima.larguraCabine}×{calculationResult.cabineMaxima.profundidadeCabine})</span>
              </button>
            )}
          </div>

          {/* Dimensão Central + KPIs em Linha */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1.5 border-y border-slate-800/80">
            <div>
              <div className="text-lg sm:text-xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                <span>{activeCabin.larguraCabine} × {activeCabin.profundidadeCabine} mm</span>
                <span className="text-[10px] font-normal text-slate-400">
                  (Folgas: +{activeCabin.sobraLarguraPoco}L / +{activeCabin.sobraProfundidadePoco}P)
                </span>
              </div>
            </div>

            {/* KPIs Compactos */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-950/80 rounded border border-slate-800 text-emerald-300">
                <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-bold">{activeCabin.numeroPassageiros} Pass.</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-950/80 rounded border border-slate-800 text-amber-300">
                <Weight className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="font-bold">{activeCabin.cargaUtilKg} kg</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-950/80 rounded border border-slate-800 text-cyan-300">
                <Maximize2 className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="font-bold">{activeCabin.areaCabineM2.toFixed(2)} m²</span>
              </div>
            </div>
          </div>

          {/* Ajuste Rápido da Porta Integrado */}
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <DoorOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-slate-300 text-[11px] font-medium">Vão da Porta:</span>
              <select
                value={currentAbertura}
                onChange={(e) => handleAberturaChange(e.target.value)}
                className="bg-slate-950 border border-sky-500/60 text-sky-200 font-mono font-bold text-xs rounded px-2 py-0.5 focus:outline-none focus:border-sky-400 cursor-pointer"
                title="Escolha o tamanho da porta para esta cabine"
              >
                {ABERTURAS_PORTA.map((abertura) => {
                  const val = parseInt(abertura, 10);
                  const fits = val < ladoEfetivo;
                  const sobra = ladoEfetivo - val;
                  const mont = Math.max(0, Math.round(sobra / 2));
                  return (
                    <option key={abertura} value={abertura} disabled={!fits}>
                      {abertura} mm {fits ? `(2x ${mont} mm)` : '(Não cabe)'}
                    </option>
                  );
                })}
              </select>
              <span className="text-[10px] text-slate-400 font-mono">
                Montantes: 2x {montanteMm} mm
              </span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {ABERTURAS_PORTA.filter(
                (a) => parseInt(a, 10) < ladoEfetivo && parseInt(a, 10) >= 600 && parseInt(a, 10) <= 1000
              ).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleAberturaChange(a)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer shrink-0 ${
                    currentAbertura === a
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-sky-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Card de Parâmetros da Obra e da Porta (Compacto e Unificado) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm space-y-2.5">
        {/* Medidas da Caixa de Corrida (Poço) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Dimensões da Caixa de Corrida (Poço)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Medidas da Obra</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* LP */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="input-largura-poco" className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                  Largura (LP)
                </label>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {shaftConfig.larguraPoco} mm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleLpStep(-50)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                  title="-50 mm"
                >
                  -50
                </button>
                <input
                  id="input-largura-poco"
                  type="number"
                  min={600}
                  max={5000}
                  step={50}
                  value={localLp}
                  onChange={(e) => handleLpChange(e.target.value)}
                  onBlur={() => {
                    const num = parseInt(localLp, 10);
                    if (isNaN(num) || num < 600) {
                      const fallback = Math.max(600, isNaN(num) ? 1600 : num);
                      setLocalLp(fallback.toString());
                      onChange({ ...shaftConfig, larguraPoco: fallback, selectedCabinKey: null });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded h-7 text-xs font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleLpStep(50)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                  title="+50 mm"
                >
                  +50
                </button>
              </div>
            </div>

            {/* PP */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="input-profundidade-poco" className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                  Profundidade (PP)
                </label>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {shaftConfig.profundidadePoco} mm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePpStep(-50)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                  title="-50 mm"
                >
                  -50
                </button>
                <input
                  id="input-profundidade-poco"
                  type="number"
                  min={600}
                  max={5000}
                  step={50}
                  value={localPp}
                  onChange={(e) => handlePpChange(e.target.value)}
                  onBlur={() => {
                    const num = parseInt(localPp, 10);
                    if (isNaN(num) || num < 600) {
                      const fallback = Math.max(600, isNaN(num) ? 1700 : num);
                      setLocalPp(fallback.toString());
                      onChange({ ...shaftConfig, profundidadePoco: fallback, selectedCabinKey: null });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded h-7 text-xs font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handlePpStep(50)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                  title="+50 mm"
                >
                  +50
                </button>
              </div>
            </div>
          </div>

          {/* Modelos Predefinidos de Poço Rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1.5">
            {shaftPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setLocalLp(preset.lp.toString());
                  setLocalPp(preset.pp.toString());
                  onChange({
                    ...shaftConfig,
                    larguraPoco: preset.lp,
                    profundidadePoco: preset.pp,
                    selectedCabinKey: null,
                  });
                }}
                className={`px-2 py-1 rounded-lg border text-left transition-all cursor-pointer ${
                  shaftConfig.larguraPoco === preset.lp && shaftConfig.profundidadePoco === preset.pp
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-bold font-mono text-white">
                  {preset.lp}×{preset.pp}
                </div>
                <div className="text-[9px] text-slate-400 truncate">{preset.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Configuração da Porta e Acessos */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Porta & Acessos
              </span>
            </div>
            <span className="text-[10px] text-sky-400 font-mono">
              Face da Cabine: {activeFaceMm} mm
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Modelo de Porta */}
            <div>
              <label htmlFor="select-shaft-tipo-porta" className="block text-[10px] text-slate-400 font-medium mb-0.5">
                Modelo da Porta
              </label>
              <select
                id="select-shaft-tipo-porta"
                value={shaftConfig.tipoPorta}
                onChange={(e) =>
                  onChange({
                    ...shaftConfig,
                    tipoPorta: e.target.value as TipoPorta,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {TIPOS_PORTA.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Lado da Porta */}
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-0.5">
                Lado da Cabine
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const newLado = 'Largura';
                    const newLadoEfetivo = shaftConfig.tipoEntrada === 'Adjacente' ? Math.min(activeLargura, activeProfundidade) : activeLargura;
                    let newAbertura = shaftConfig.aberturaPorta;
                    if (!newAbertura || parseInt(newAbertura, 10) >= newLadoEfetivo) {
                      newAbertura = getMaiorAberturaValida(newLadoEfetivo);
                    }
                    onChange({ ...shaftConfig, ladoPorta: newLado, aberturaPorta: newAbertura });
                  }}
                  className={`py-1 px-1.5 rounded border text-center text-[11px] transition-colors cursor-pointer ${
                    shaftConfig.ladoPorta === 'Largura'
                      ? 'border-sky-500 bg-sky-950/50 text-sky-200 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Largura ({activeLargura})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newLado = 'Profundidade';
                    const newLadoEfetivo = shaftConfig.tipoEntrada === 'Adjacente' ? Math.min(activeLargura, activeProfundidade) : activeProfundidade;
                    let newAbertura = shaftConfig.aberturaPorta;
                    if (!newAbertura || parseInt(newAbertura, 10) >= newLadoEfetivo) {
                      newAbertura = getMaiorAberturaValida(newLadoEfetivo);
                    }
                    onChange({ ...shaftConfig, ladoPorta: newLado, aberturaPorta: newAbertura });
                  }}
                  className={`py-1 px-1.5 rounded border text-center text-[11px] transition-colors cursor-pointer ${
                    shaftConfig.ladoPorta === 'Profundidade'
                      ? 'border-sky-500 bg-sky-950/50 text-sky-200 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Lateral ({activeProfundidade})
                </button>
              </div>
            </div>

            {/* Entradas */}
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-0.5">
                Entradas de Pavimento
              </label>
              <div className="grid grid-cols-3 gap-1">
                {TIPOS_ENTRADA.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const newLadoEfetivo = t === 'Adjacente' ? Math.min(activeLargura, activeProfundidade) : activeFaceMm;
                      let newAbertura = shaftConfig.aberturaPorta;
                      if (!newAbertura || parseInt(newAbertura, 10) >= newLadoEfetivo) {
                        newAbertura = getMaiorAberturaValida(newLadoEfetivo);
                      }
                      onChange({ ...shaftConfig, tipoEntrada: t, aberturaPorta: newAbertura });
                    }}
                    className={`py-1 px-1 rounded border text-center text-[10px] transition-colors cursor-pointer ${
                      shaftConfig.tipoEntrada === t
                        ? 'border-sky-500 bg-sky-950/50 text-sky-200 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sistema Mecânico (Tração & Chassis) - Compact Collapsible */}
        <div className="pt-1.5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="flex items-center justify-between w-full text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer py-0.5"
          >
            <span className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tração, Guias e Arcada ({shaftConfig.acionamento} · {shaftConfig.ladoArcada} · {shaftConfig.arcada})</span>
            </span>
            {showAdvancedSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvancedSettings && (
            <div className="grid grid-cols-3 gap-2 mt-1.5 pt-1.5 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-0.5">Acionamento</label>
                <select
                  value={shaftConfig.acionamento}
                  onChange={(e) => onChange({ ...shaftConfig, acionamento: e.target.value as Acionamento, selectedCabinKey: null })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded p-1 text-xs"
                >
                  {ACIONAMENTOS.map((a) => (<option key={a} value={a}>{a}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-0.5">Chassis</label>
                <select
                  value={shaftConfig.ladoArcada}
                  onChange={(e) => onChange({ ...shaftConfig, ladoArcada: e.target.value as LadoArcada, selectedCabinKey: null })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded p-1 text-xs"
                >
                  {LADOS_ARCADA.map((l) => (<option key={l} value={l}>{l}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-0.5">Arcada</label>
                <select
                  value={shaftConfig.arcada}
                  onChange={(e) => onChange({ ...shaftConfig, arcada: e.target.value as Arcada, selectedCabinKey: null })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded p-1 text-xs"
                >
                  {ARCADAS.map((a) => (<option key={a} value={a}>{a === 'L' ? 'L (Mochila)' : 'Suspensão'}</option>))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Outras Opções de Cabine - Compact Collapsible Drawer */}
      {calculationResult.cabinesPossiveis.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setIsAlternativeCabinsOpen(!isAlternativeCabinsOpen)}
            className="flex items-center justify-between w-full p-3 text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">
                Outras Opções de Cabine para este Poço
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                {filteredCabins.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>{isAlternativeCabinsOpen ? 'Ocultar' : 'Ver Opções'}</span>
              {isAlternativeCabinsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {isAlternativeCabinsOpen && (
            <div className="p-3 pt-0 border-t border-slate-800/80">
              {/* Filtros */}
              <div className="flex items-center gap-1 my-2 overflow-x-auto text-[11px] pb-1">
                {[
                  { id: 'all', label: `Todas (${calculationResult.cabinesPossiveis.length})` },
                  { id: 'accessible', label: 'Acessível NBR 313' },
                  { id: 'commercial', label: '≥ 6 Pass.' },
                  { id: 'compact', label: 'Compactas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilter(f.id as any)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer shrink-0 ${
                      selectedFilter === f.id
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Lista Compacta */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {filteredCabins.map((cabin) => {
                  const cabinKey = `${cabin.larguraCabine}x${cabin.profundidadeCabine}`;
                  const isSelected =
                    activeCabin &&
                    activeCabin.larguraCabine === cabin.larguraCabine &&
                    activeCabin.profundidadeCabine === cabin.profundidadeCabine;

                  return (
                    <div
                      key={cabinKey}
                      onClick={() => handleSelectCabin(cabin)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/40 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {cabin.larguraCabine} × {cabin.profundidadeCabine} mm
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          · {cabin.numeroPassageiros} pass. ({cabin.cargaUtilKg}kg)
                        </span>
                        {cabin.tag && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono hidden sm:inline">
                            {cabin.tag}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCabin(cabin);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isSelected ? 'Ativa' : 'Selecionar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
