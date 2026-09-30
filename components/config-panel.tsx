'use client';

import React from 'react';
import {
  ElevatorConfigState,
  Acionamento,
  Arcada,
  Posicao,
  TipoPorta,
  TipoEntrada,
  LadoArcada,
  LadoInstalacaoPorta,
  ACIONAMENTOS,
  ARCADAS,
  POSICOES,
  TIPOS_PORTA,
  TIPOS_ENTRADA,
  LADOS_ARCADA,
  LADOS_INSTALACAO_PORTA,
  ABERTURAS_PORTA,
  ELEVATOR_PRESETS,
  ElevatorPreset,
  getMaiorAberturaValida,
  calculateShaftClearances,
  ShaftConfigState,
  INITIAL_SHAFT_STATE,
} from '@/lib/elevator-calculator';
import {
  Sliders,
  Settings2,
  Box,
  DoorOpen,
  Zap,
  Layers,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Building2,
} from 'lucide-react';
import { ShaftCalculator } from './shaft-calculator';
import { ClearancesConfigModal } from './clearances-config-modal';

interface ConfigPanelProps {
  state: ElevatorConfigState;
  onChange: (newState: ElevatorConfigState) => void;
  configMode?: 'cabine' | 'poco';
  onConfigModeChange?: (mode: 'cabine' | 'poco') => void;
  onOpenSystemSettings?: () => void;
  shaftConfig?: ShaftConfigState;
  onShaftConfigChange?: (newConfig: ShaftConfigState) => void;
}

export function ConfigPanel({
  state,
  onChange,
  configMode: controlledMode,
  onConfigModeChange,
  onOpenSystemSettings,
  shaftConfig,
  onShaftConfigChange,
}: ConfigPanelProps) {
  const [internalMode, setInternalMode] = React.useState<'cabine' | 'poco'>('cabine');
  const [showClearancesModal, setShowClearancesModal] = React.useState(false);
  const activeMode = controlledMode !== undefined ? controlledMode : internalMode;

  const setMode = (mode: 'cabine' | 'poco') => {
    if (onConfigModeChange) {
      onConfigModeChange(mode);
    } else {
      setInternalMode(mode);
    }
  };

  const defaultClearances = React.useMemo(() => {
    return calculateShaftClearances({
      acionamento: state.acionamento,
      arcada: state.arcada,
      ladoArcada: state.ladoArcada,
      tipoEntrada: state.tipoEntrada,
    });
  }, [state.acionamento, state.arcada, state.ladoArcada, state.tipoEntrada]);


  const larguraNum = parseInt(state.larguraCabine, 10) || 800;
  const profundidadeNum = parseInt(state.profundidadeCabine, 10) || 1250;
  const ladoInstalacao: LadoInstalacaoPorta = state.ladoPorta || 'Largura';
  const ladoFacePorta = ladoInstalacao === 'Profundidade' ? profundidadeNum : larguraNum;
  const ladoEfetivo =
    state.tipoEntrada === 'Adjacente'
      ? Math.min(larguraNum, profundidadeNum)
      : ladoFacePorta;

  const aberturaNum = parseInt(state.aberturaPorta, 10) || 700;
  const isPortaValida = aberturaNum < ladoEfetivo;
  const diferencaMm = ladoEfetivo - aberturaNum;
  const montanteMm = Math.max(0, Math.round(diferencaMm / 2));
  const maxAberturaSugerida = getMaiorAberturaValida(ladoEfetivo);

  const updateField = <K extends keyof ElevatorConfigState>(
    field: K,
    value: ElevatorConfigState[K]
  ) => {
    let nextState = {
      ...state,
      [field]: value,
    };

    // Se alterou largura, profundidade, tipo de entrada ou lado da porta,
    // verifica se a porta atual ainda é estritamente menor que o lado da cabine.
    if (
      field === 'larguraCabine' ||
      field === 'profundidadeCabine' ||
      field === 'ladoPorta' ||
      field === 'tipoEntrada'
    ) {
      const nextLargura = parseInt(nextState.larguraCabine, 10) || 800;
      const nextProf = parseInt(nextState.profundidadeCabine, 10) || 1250;
      const nextLado = (nextState.ladoPorta || 'Largura') === 'Profundidade' ? nextProf : nextLargura;
      const nextLadoEfetivo =
        nextState.tipoEntrada === 'Adjacente' ? Math.min(nextLargura, nextProf) : nextLado;
      const nextAbertura = parseInt(nextState.aberturaPorta, 10) || 700;

      if (nextAbertura >= nextLadoEfetivo) {
        nextState.aberturaPorta = getMaiorAberturaValida(nextLadoEfetivo);
      }
    }

    onChange(nextState);
  };

  const hasCustomClearances = React.useMemo(() => {
    return Boolean(
      state.customMenorFolga !== undefined ||
      state.customFolgaFrontal !== undefined ||
      state.customFolgaFundo !== undefined ||
      state.baseChassisHidraulicoL !== undefined ||
      state.baseChassisHidraulicoSuspensao !== undefined ||
      state.baseChassisEletricoL !== undefined ||
      state.baseChassisEletricoSuspensaoLateral !== undefined ||
      state.baseChassisEletricoSuspensaoFundo !== undefined ||
      state.basePorta2FL !== undefined ||
      state.basePorta3FL !== undefined ||
      state.basePorta2FC !== undefined ||
      state.basePorta4FC !== undefined
    );
  }, [state]);

  const applyPreset = (preset: ElevatorPreset) => {
    onChange({
      ...state,
      larguraCabine: preset.largura,
      profundidadeCabine: preset.profundidade,
      ladoPorta: preset.ladoPorta || 'Largura',
      aberturaPorta: preset.aberturaPorta,
      acionamento: preset.acionamento,
      arcada: preset.arcada,
      tipoPorta: preset.tipoPorta,
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Container de Abas e Ações Globais */}
      <div className="flex items-center gap-1.5">
        {/* Segmented Controller: Alternar entre Dimensionar por Cabine e por Poço */}
        <div className="flex-1 bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1 shadow-sm">
          <button
            id="btn-mode-cabine"
            type="button"
            onClick={() => setMode('cabine')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'cabine'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configurar por Cabine</span>
            <span className="sm:hidden">Por Cabine</span>
          </button>

          <button
            id="btn-mode-poco"
            type="button"
            onClick={() => setMode('poco')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'poco'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Calcular por Poço</span>
            <span className="sm:hidden">Por Poço</span>
            <span className="hidden sm:inline-block px-1 py-0.2 bg-emerald-950/60 text-emerald-200 border border-emerald-500/30 text-[9px] rounded font-mono font-bold">
              50mm
            </span>
          </button>
        </div>
        
        {/* Botão de Folgas Técnicas Salvas */}
        <button
          onClick={() => setShowClearancesModal(true)}
          title={hasCustomClearances ? "Configuração de Folgas Técnicas (Personalizadas e Salvas)" : "Configurar Folgas Técnicas (Salvas no Programa)"}
          className="relative p-2 shrink-0 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors rounded-xl flex items-center justify-center cursor-pointer group"
        >
          <Settings2 className="w-4 h-4" />
          {hasCustomClearances && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-sm"
              title="Folgas personalizadas salvas e ativas no programa"
            />
          )}
        </button>

        {/* Botão de Configurações do Sistema e Logotipo */}
        {onOpenSystemSettings && (
          <button
            type="button"
            onClick={onOpenSystemSettings}
            title="Configurações do Sistema, Logotipo e Marca d'Água"
            className="p-2 shrink-0 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors rounded-xl flex items-center justify-center cursor-pointer group"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Renderização Condicional: Modo Poço (Inverso) ou Modo Cabine (Direto) */}
      {activeMode === 'poco' ? (
        <ShaftCalculator
          shaftConfig={shaftConfig ?? INITIAL_SHAFT_STATE}
          onChange={onShaftConfigChange ?? (() => {})}
          customClearances={state}
        />
      ) : (
        <>
          {/* Quick Presets selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                  Modelos Padrão / Presets Rápidos
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">NBR NM 207 / NM 313</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {ELEVATOR_PRESETS.map((preset) => {
                const isSelected =
                  state.larguraCabine === preset.largura &&
                  state.profundidadeCabine === preset.profundidade &&
                  state.aberturaPorta === preset.aberturaPorta &&
                  state.acionamento === preset.acionamento &&
                  state.arcada === preset.arcada &&
                  state.tipoPorta === preset.tipoPorta;

                return (
                  <button
                    key={preset.id}
                    id={`preset-${preset.id}`}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 shadow-sm shadow-cyan-900/30'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-[11px] font-semibold leading-snug line-clamp-1">
                      {preset.nome}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {preset.largura}×{preset.profundidade} mm
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

      {/* Dimensões da Cabine Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-1.5 pb-2 mb-2.5 border-b border-slate-800">
          <div className="p-1 rounded bg-cyan-950/70 border border-cyan-800/50 text-cyan-400">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Dimensões da Cabine</h2>
            <p className="text-[10px] text-slate-400">
              Medidas internas úteis da cabine e vão de abertura da porta
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
          {/* Largura Cabine */}
          <div>
            <label
              htmlFor="input-largura-cabine"
              className="block text-[11px] font-medium text-slate-300 mb-1"
            >
              Largura da Cabine (mm)
            </label>
            <div className="relative">
              <input
                id="input-largura-cabine"
                type="number"
                min="500"
                max="3000"
                step="50"
                value={state.larguraCabine}
                onChange={(e) => updateField('larguraCabine', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg text-xs text-slate-100 font-mono transition-colors"
                placeholder="ex: 800"
              />
              <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-mono pointer-events-none">
                mm
              </span>
            </div>
          </div>

          {/* Profundidade Cabine */}
          <div>
            <label
              htmlFor="input-profundidade-cabine"
              className="block text-[11px] font-medium text-slate-300 mb-1"
            >
              Profundidade da Cabine (mm)
            </label>
            <div className="relative">
              <input
                id="input-profundidade-cabine"
                type="number"
                min="600"
                max="3500"
                step="50"
                value={state.profundidadeCabine}
                onChange={(e) => updateField('profundidadeCabine', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg text-xs text-slate-100 font-mono transition-colors"
                placeholder="ex: 1250"
              />
              <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-mono pointer-events-none">
                mm
              </span>
            </div>
          </div>
        </div>

        {/* Lado de Instalação da Porta */}
        <div className="mb-2.5">
          <label className="flex items-center justify-between text-[11px] font-medium text-slate-300 mb-1">
            <span className="flex items-center gap-1">
              <DoorOpen className="w-3.5 h-3.5 text-cyan-400" />
              Lado da Cabine Onde Vai a Porta
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Face: {ladoEfetivo} mm
            </span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              id="btn-lado-porta-largura"
              type="button"
              onClick={() => updateField('ladoPorta', 'Largura')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                ladoInstalacao === 'Largura'
                  ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-sm'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-semibold flex items-center justify-between">
                <span>Na Largura (Frontal)</span>
                {ladoInstalacao === 'Largura' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Face: {larguraNum} mm
              </div>
            </button>

            <button
              id="btn-lado-porta-profundidade"
              type="button"
              onClick={() => updateField('ladoPorta', 'Profundidade')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                ladoInstalacao === 'Profundidade'
                  ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-sm'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-semibold flex items-center justify-between">
                <span>Na Profundidade (Lateral)</span>
                {ladoInstalacao === 'Profundidade' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Face: {profundidadeNum} mm
              </div>
            </button>
          </div>
          {state.tipoEntrada === 'Adjacente' && (
            <p className="text-[10px] text-amber-400 mt-1">
              * Entrada Adjacente: Portas na largura e na lateral. O vão é limitado pela menor face ({ladoEfetivo} mm).
            </p>
          )}
        </div>

        {/* Abertura da Porta */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-300 mb-1">
            <label htmlFor="select-abertura-porta">
              Abertura da Porta - Vão Livre (mm)
            </label>
            <span className="text-[10px] font-mono text-cyan-400">
              Passo 100 mm (700 a 1200 mm)
            </span>
          </div>
          <select
            id="select-abertura-porta"
            value={state.aberturaPorta}
            onChange={(e) => updateField('aberturaPorta', e.target.value)}
            className={`w-full px-2.5 py-1.5 bg-slate-950 border rounded-lg text-xs text-slate-100 font-mono transition-colors ${
              isPortaValida
                ? 'border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                : 'border-rose-500 text-rose-300 focus:ring-1 focus:ring-rose-500'
            }`}
          >
            {ABERTURAS_PORTA.map((abertura) => {
              const valor = parseInt(abertura, 10);
              const isMenor = valor < ladoEfetivo;
              const sobra = ladoEfetivo - valor;
              const montante = Math.max(0, Math.round(sobra / 2));

              return (
                <option
                  key={abertura}
                  value={abertura}
                  disabled={!isMenor}
                  className={isMenor ? 'text-slate-100 bg-slate-950' : 'text-slate-500 bg-slate-900'}
                >
                  {isMenor
                    ? `${abertura} mm — Montantes: 2x ${montante} mm ${abertura === '800' ? '(Padrão)' : abertura === '900' ? '(Acessib.)' : ''}`
                    : `${abertura} mm — (Inválido: ≥ ${ladoEfetivo} mm do lado da cabine)`}
                </option>
              );
            })}
          </select>

          {/* Feedback Visual da Regra de Porta */}
          {isPortaValida ? (
            <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-start gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-300 text-[11px]">
                  Porta em conformidade: {aberturaNum} mm &lt; {ladoEfetivo} mm (face da cabine)
                </div>
                <p className="text-slate-300 text-[10px] mt-0.5">
                  Montantes frontais:{' '}
                  <span className="font-mono text-emerald-300 font-semibold">{diferencaMm} mm</span>{' '}
                  (<span className="font-mono text-emerald-300 font-semibold">{montanteMm} mm</span> de cada lado).
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-2 p-2 rounded-lg bg-rose-950/60 border border-rose-500/60 flex items-start gap-1.5 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-rose-200 text-[11px]">
                  Abertura inválida: a porta não pode ser igual ou maior que a face da cabine!
                </div>
                <button
                  type="button"
                  onClick={() => updateField('aberturaPorta', maxAberturaSugerida)}
                  className="mt-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Ajustar para {maxAberturaSugerida} mm</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuração do Equipamento Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-1.5 pb-2 mb-2.5 border-b border-slate-800">
          <div className="p-1 rounded bg-indigo-950/70 border border-indigo-800/50 text-indigo-400">
            <Settings2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Configuração do Equipamento</h2>
            <p className="text-[10px] text-slate-400">
              Acionamento motriz, sistema estrutural e arquitetura das portas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Acionamento */}
          <div>
            <label
              htmlFor="select-acionamento"
              className="block text-[11px] font-medium text-slate-300 mb-1"
            >
              Acionamento
            </label>
            <select
              id="select-acionamento"
              value={state.acionamento}
              onChange={(e) => updateField('acionamento', e.target.value as Acionamento)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-xs text-slate-100 transition-colors"
            >
              {ACIONAMENTOS.map((op) => (
                <option key={op} value={op}>
                  {op} {op === 'Elétrico' ? '(Com Contrapeso)' : '(Hidráulico)'}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Arcada */}
          <div>
            <label
              htmlFor="select-arcada"
              className="block text-[11px] font-medium text-slate-300 mb-1"
            >
              Tipo de Arcada
            </label>
            <select
              id="select-arcada"
              value={state.arcada}
              onChange={(e) => updateField('arcada', e.target.value as Arcada)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-xs text-slate-100 transition-colors"
            >
              {ARCADAS.map((op) => (
                <option key={op} value={op}>
                  {op === 'L' ? 'Arcada Tipo L (Mochila)' : 'Arcada de Suspensão'}
                </option>
              ))}
            </select>
          </div>

          {/* Posição Contrapeso/Máquina */}
          <div>
            <label
              htmlFor="select-posicao"
              className="block text-[11px] font-medium text-slate-300 mb-1"
            >
              Posição (Contrapeso/Máquina)
            </label>
            <select
              id="select-posicao"
              value={state.posicao}
              onChange={(e) => updateField('posicao', e.target.value as Posicao)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-xs text-slate-100 transition-colors"
            >
              {POSICOES.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Porta */}
          <div>
            <label
              htmlFor="select-tipo-porta"
              className="block text-[11px] font-medium text-slate-300 mb-1"
            >
              Tipo de Porta
            </label>
            <select
              id="select-tipo-porta"
              value={state.tipoPorta}
              onChange={(e) => updateField('tipoPorta', e.target.value as TipoPorta)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-xs text-slate-100 transition-colors"
            >
              {TIPOS_PORTA.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Entrada */}
          <div>
            <label
              htmlFor="select-tipo-entrada"
              className="block text-[11px] font-medium text-slate-300 mb-1"
            >
              Tipo de Entrada
            </label>
            <select
              id="select-tipo-entrada"
              value={state.tipoEntrada}
              onChange={(e) => updateField('tipoEntrada', e.target.value as TipoEntrada)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-xs text-slate-100 transition-colors"
            >
              {TIPOS_ENTRADA.map((op) => (
                <option key={op} value={op}>
                  {op} {op === 'Unilateral' ? '(1 Acesso)' : op === 'Oposta' ? '(Frontal/Fundo)' : '(Frontal/Lateral)'}
                </option>
              ))}
            </select>
          </div>

          {/* Lado da Arcada / Chassis */}
          <div>
            <label
              htmlFor="select-lado-arcada"
              className="block text-[11px] font-medium text-slate-300 mb-1"
            >
              Lado da Arcada / Chassis
            </label>
            <select
              id="select-lado-arcada"
              value={state.ladoArcada}
              onChange={(e) => updateField('ladoArcada', e.target.value as LadoArcada)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-xs text-slate-100 transition-colors"
            >
              {LADOS_ARCADA.map((op) => (
                <option key={op} value={op}>
                  {op} {op === 'Lateral' ? '(Guias na Lateral)' : '(Guias no Fundo)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      </>
      )}

      <ClearancesConfigModal
        isOpen={showClearancesModal}
        onClose={() => setShowClearancesModal(false)}
        state={state}
        onChange={onChange}
      />
    </div>
  );
}
