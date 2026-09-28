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
    <div className="flex flex-col gap-5">
      {/* Banner Explicativo e Título */}
      <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Cálculo por Poço (Medidas Reais da Obra)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Múltiplos de 50 mm
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Informe as medidas livres da caixa de corrida (LP × PP). O sistema calcula instantaneamente a cabine que cabe no local sem puxar dados da página por cabine.
              </p>
            </div>
          </div>
        </div>

        {/* Regra de Padronização Modular */}
        <div className="mt-3 pt-3 border-t border-emerald-900/40 flex items-center gap-2 text-xs text-emerald-200/90">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Cálculo Automático e Preciso:</strong> Todas as cabines são calculadas em <strong>múltiplos estritos de 50 mm</strong> (sem números quebrados) para garantir modularidade dos painéis de aço e facilidade de fabricação.
          </span>
        </div>
      </div>

      {/* 1. Medidas Informadas da Caixa de Corrida */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              1. Medidas da Caixa de Corrida (Poço)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Medidas Reais da Obra (mm)</span>
        </div>

        {/* Inputs de Largura e Profundidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Largura do Poço (LP) */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-largura-poco" className="text-xs font-semibold text-slate-300">
                Largura do Poço (LP)
              </label>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {shaftConfig.larguraPoco} mm
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleLpStep(-50)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-bold font-mono transition-colors cursor-pointer"
                title="Diminuir 50 mm"
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
                className="flex-1 bg-slate-900 border border-slate-700 text-white rounded px-3 py-1.5 text-sm font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => handleLpStep(50)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-bold font-mono transition-colors cursor-pointer"
                title="Aumentar 50 mm"
              >
                +50
              </button>
            </div>

            {/* Atalhos Rápidos para LP */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500 mr-1 shrink-0">Comuns:</span>
              {[1400, 1500, 1600, 1750, 1850, 2000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setLocalLp(v.toString());
                    onChange({ ...shaftConfig, larguraPoco: v, selectedCabinKey: null });
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors shrink-0 cursor-pointer ${
                    shaftConfig.larguraPoco === v
                      ? 'bg-emerald-500 text-slate-950 font-bold'
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
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {shaftConfig.profundidadePoco} mm
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePpStep(-50)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-bold font-mono transition-colors cursor-pointer"
                title="Diminuir 50 mm"
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
                className="flex-1 bg-slate-900 border border-slate-700 text-white rounded px-3 py-1.5 text-sm font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => handlePpStep(50)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-bold font-mono transition-colors cursor-pointer"
                title="Aumentar 50 mm"
              >
                +50
              </button>
            </div>

            {/* Atalhos Rápidos para PP */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500 mr-1 shrink-0">Comuns:</span>
              {[1500, 1600, 1700, 1850, 2000, 2400].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setLocalPp(v.toString());
                    onChange({ ...shaftConfig, profundidadePoco: v, selectedCabinKey: null });
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors shrink-0 cursor-pointer ${
                    shaftConfig.profundidadePoco === v
                      ? 'bg-emerald-500 text-slate-950 font-bold'
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
            Ou escolha medidas típicas de obra:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  shaftConfig.larguraPoco === preset.lp && shaftConfig.profundidadePoco === preset.pp
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
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

        {/* Configurações Mecânicas do Poço */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ajustar Sistema Mecânico (Tração, Guias e Arcada do Poço)</span>
              {showAdvancedSettings ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </button>
          </div>

          {showAdvancedSettings && (
            <div className="mt-3 p-3 bg-slate-950/80 rounded-lg border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* Acionamento */}
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">
                  Acionamento
                </label>
                <select
                  value={shaftConfig.acionamento}
                  onChange={(e) =>
                    onChange({
                      ...shaftConfig,
                      acionamento: e.target.value as Acionamento,
                      selectedCabinKey: null,
                    })
                  }
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
                  value={shaftConfig.ladoArcada}
                  onChange={(e) =>
                    onChange({
                      ...shaftConfig,
                      ladoArcada: e.target.value as LadoArcada,
                      selectedCabinKey: null,
                    })
                  }
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
                  value={shaftConfig.arcada}
                  onChange={(e) =>
                    onChange({
                      ...shaftConfig,
                      arcada: e.target.value as Arcada,
                      selectedCabinKey: null,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
                >
                  {ARCADAS.map((a) => (
                    <option key={a} value={a}>
                      {a === 'L' ? 'Arcada L (Mochila)' : 'Arcada Suspensão'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Porta */}
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">
                  Modelo de Porta
                </label>
                <select
                  value={shaftConfig.tipoPorta}
                  onChange={(e) =>
                    onChange({
                      ...shaftConfig,
                      tipoPorta: e.target.value as TipoPorta,
                      selectedCabinKey: null,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
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
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">
                  Lado de Instalação da Porta
                </label>
                <select
                  value={shaftConfig.ladoPorta}
                  onChange={(e) =>
                    onChange({
                      ...shaftConfig,
                      ladoPorta: e.target.value as LadoInstalacaoPorta,
                      selectedCabinKey: null,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
                >
                  {LADOS_INSTALACAO_PORTA.map((lp) => (
                    <option key={lp} value={lp}>
                      {lp} da Cabine
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
                  value={shaftConfig.tipoEntrada}
                  onChange={(e) =>
                    onChange({
                      ...shaftConfig,
                      tipoEntrada: e.target.value as TipoEntrada,
                      selectedCabinKey: null,
                    })
                  }
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

      {/* Alerta Normativo: Cabine Fora da Norma (porém dimensionada e calculada conforme o poço informado) */}
      {(activeCabin?.isForaDaNorma || calculationResult.isForaDaNorma) && (
        <div className="bg-amber-950/50 border-2 border-amber-500/60 rounded-xl p-4 flex items-start gap-3.5 text-amber-200 shadow-md">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Aviso: Cabine Fora do Padrão Normativo ABNT NBR 16858-1 / NM 313
              </h4>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Dimensionamento Sob Medida Ativo
              </span>
            </div>
            <p className="text-xs text-amber-200/90 mt-1.5 leading-relaxed">
              O poço informado ({shaftConfig.larguraPoco} × {shaftConfig.profundidadePoco} mm) resulta em uma cabine de{' '}
              <strong className="text-white font-mono">{activeCabin?.larguraCabine} × {activeCabin?.profundidadeCabine} mm</strong>,
              abaixo das medidas mínimas recomendadas pelas normas técnicas (800 × 1200 mm para residencial / 1100 × 1400 mm para acessibilidade).
            </p>
            <div className="mt-2.5 text-[11px] text-amber-300 bg-amber-900/40 border border-amber-700/50 rounded-lg px-3 py-1.5 font-medium flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>
                <strong>Cálculo e desenho realizados com sucesso:</strong> A cabine foi calculada e desenhada proporcionalmente em múltiplos de 50 mm para caber com segurança no tamanho exato do poço informado.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CARD PRINCIPAL: Cabine Calculada Ativa para o Poço Informado */}
      {activeCabin && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border-2 border-emerald-500 rounded-xl p-4 sm:p-5 shadow-lg relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded-md uppercase tracking-wider">
                  {isCurrentMax ? 'Cabine de Máximo Aproveitamento' : 'Cabine Selecionada'}
                </span>
                <span className="text-xs text-emerald-300 font-semibold">
                  Múltiplo estrito de 50 mm
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-900/60 text-cyan-200 border border-cyan-500/40 rounded-full">
                  Ativa no Projeto e Planta
                </span>
                {activeCabin.isForaDaNorma && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Sob Medida (Fora da Norma)
                  </span>
                )}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white font-mono mt-1.5 tracking-tight">
                {activeCabin.larguraCabine} × {activeCabin.profundidadeCabine} mm
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Calculada para caber no poço informado de <strong className="text-white font-mono">{shaftConfig.larguraPoco} × {shaftConfig.profundidadePoco} mm</strong>
              </p>
            </div>

            {!isCurrentMax && calculationResult.cabineMaxima && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...shaftConfig,
                    selectedCabinKey: null,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Usar Máxima Possível ({calculationResult.cabineMaxima.larguraCabine} × {calculationResult.cabineMaxima.profundidadeCabine})</span>
              </button>
            )}
          </div>

          {/* Grid de Métricas da Cabine Calculada */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-emerald-900/50">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-emerald-900/40">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                Lotação NBR 16858-1
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300 font-mono">
                  {activeCabin.numeroPassageiros} {activeCabin.numeroPassageiros === 1 ? 'Passageiro' : 'Passageiros'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-emerald-900/40">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                Carga Útil
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Weight className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300 font-mono">
                  {activeCabin.cargaUtilKg} kg
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-emerald-900/40">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                Área Útil Real
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-cyan-300 font-mono">
                  {activeCabin.areaCabineM2.toFixed(2)} m²
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-emerald-900/40">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                Vão Livre de Porta
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <DoorOpen className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-bold text-sky-300 font-mono">
                  {activeCabin.maxAberturaPorta} mm
                </span>
              </div>
            </div>
          </div>

          {/* Sobras de Folga no Poço */}
          <div className="mt-3 pt-2.5 border-t border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-emerald-200/80">
            <span>
              Sobra de folga na largura: <strong className="text-white font-mono">+{activeCabin.sobraLarguraPoco} mm</strong> | Sobra na profundidade: <strong className="text-white font-mono">+{activeCabin.sobraProfundidadePoco} mm</strong>
            </span>
            <span className="font-mono text-emerald-400 text-[10px]">
              Poço mín. exigido: {activeCabin.larguraPocoMinima} × {activeCabin.profundidadePocoMinima} mm
            </span>
          </div>
        </div>
      )}

      {/* 2. Lista de Outras Opções de Cabine Viáveis que Cabem neste Poço */}
      {calculationResult.cabinesPossiveis.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  2. Outras Opções de Cabine que Cabem neste Poço ({filteredCabins.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Clique em qualquer opção para alterar o tamanho da cabine mantendo o seu poço de <strong className="text-slate-200 font-mono">{shaftConfig.larguraPoco} × {shaftConfig.profundidadePoco} mm</strong>.
              </p>
            </div>

            {/* Filtros Rápidos */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer shrink-0 ${
                  selectedFilter === 'all'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({calculationResult.cabinesPossiveis.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('accessible')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer shrink-0 ${
                  selectedFilter === 'accessible'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Acessível NBR 313
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('commercial')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer shrink-0 ${
                  selectedFilter === 'commercial'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ≥ 6 Pass.
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('compact')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer shrink-0 ${
                  selectedFilter === 'compact'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Compactas
              </button>
            </div>
          </div>

          {/* Grid de Cards de Cabines Viáveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredCabins.map((cabin) => {
              const cabinKey = `${cabin.larguraCabine}x${cabin.profundidadeCabine}`;
              const isSelected =
                activeCabin &&
                activeCabin.larguraCabine === cabin.larguraCabine &&
                activeCabin.profundidadeCabine === cabin.profundidadeCabine;

              return (
                <div
                  key={cabinKey}
                  onClick={() =>
                    onChange({
                      ...shaftConfig,
                      selectedCabinKey: cabinKey,
                    })
                  }
                  className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/30 shadow-md ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    {/* Header do Card */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-white font-mono">
                          {cabin.larguraCabine} × {cabin.profundidadeCabine} mm
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({cabin.proporcao})
                        </span>
                      </div>

                      {isSelected ? (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Ativa
                        </span>
                      ) : cabin.tag ? (
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
                      ) : null}
                    </div>

                    {/* Especificações Técnicas */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 my-2 pt-2 border-t border-slate-800/70">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Lotação</span>
                        <span className="font-semibold text-emerald-400 font-mono">
                          {cabin.numeroPassageiros} pass. ({cabin.cargaUtilKg} kg)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Área Útil</span>
                        <span className="font-semibold text-cyan-400 font-mono">
                          {cabin.areaCabineM2.toFixed(2)} m²
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Porta Máx.</span>
                        <span className="font-semibold text-sky-400 font-mono">
                          {cabin.maxAberturaPorta} mm
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>Poço mín: {cabin.larguraPocoMinima} × {cabin.profundidadePocoMinima} mm</span>
                      <span className="text-emerald-400">
                        Sobra: +{cabin.sobraLarguraPoco}L / +{cabin.sobraProfundidadePoco}P mm
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Múltiplo de 50 mm
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange({
                          ...shaftConfig,
                          selectedCabinKey: cabinKey,
                        });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Selecionada</span>
                        </>
                      ) : (
                        <span>Selecionar</span>
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
