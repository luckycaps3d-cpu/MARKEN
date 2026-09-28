'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ElevatorConfigState,
  INITIAL_STATE,
  calculateElevator,
  ShaftConfigState,
  INITIAL_SHAFT_STATE,
  calculatePossibleCabinsFromShaft,
  getMaiorAberturaValida,
} from '@/lib/elevator-calculator';
import { generateElevatorPdf } from '@/lib/elevator-pdf';
import { loadClearancesFromStorage } from '@/lib/clearances-storage';
import {
  CompanySettings,
  DEFAULT_COMPANY_SETTINGS,
  loadCompanySettingsFromStorage,
} from '@/lib/company-settings';
import { ConfigPanel } from '@/components/config-panel';
import { ResultsPanel } from '@/components/results-panel';
import { BlueprintCanvas } from '@/components/blueprint-canvas';
import { SystemSettingsModal } from '@/components/system-settings-modal';
import {
  Building2,
  Compass,
  FileDown,
  Layers,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Database,
  Sliders,
} from 'lucide-react';

export default function ElevatorConfiguratorPage() {
  const [cabinState, setCabinState] = useState<ElevatorConfigState>(INITIAL_STATE);
  const [shaftConfig, setShaftConfig] = useState<ShaftConfigState>(INITIAL_SHAFT_STATE);
  const [mobileTab, setMobileTab] = useState<'config' | 'blueprint'>('config');
  const [configMode, setConfigMode] = useState<'cabine' | 'poco'>('cabine');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);

  // Carrega as folgas técnicas salvas no navegador pelo usuário ao iniciar o programa
  useEffect(() => {
    const saved = loadClearancesFromStorage();
    if (saved) {
      const timer = setTimeout(() => {
        setCabinState((prev) => ({
          ...prev,
          ...saved,
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Carrega as configurações da empresa e logotipo salvas
  useEffect(() => {
    const current = loadCompanySettingsFromStorage();
    if (current) {
      const timer = setTimeout(() => {
        setCompanySettings(current);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Escuta atualizações de configurações da empresa disparadas por outros componentes
  useEffect(() => {
    const handleUpdate = () => {
      const current = loadCompanySettingsFromStorage();
      setCompanySettings(current);
    };
    window.addEventListener('company-settings-updated', handleUpdate);
    return () => window.removeEventListener('company-settings-updated', handleUpdate);
  }, []);

  // Cálculo inverso de cabines viáveis para o poço informado (100% independente da página por cabine)
  const shaftCabinCalculation = useMemo(() => {
    return calculatePossibleCabinsFromShaft({
      larguraPoco: shaftConfig.larguraPoco,
      profundidadePoco: shaftConfig.profundidadePoco,
      acionamento: shaftConfig.acionamento,
      arcada: shaftConfig.arcada,
      ladoArcada: shaftConfig.ladoArcada,
      tipoEntrada: shaftConfig.tipoEntrada,
      tipoPorta: shaftConfig.tipoPorta,
      ladoPorta: shaftConfig.ladoPorta,
      customMenorFolga: cabinState.customMenorFolga,
      customFolgaFrontal: cabinState.customFolgaFrontal,
      customFolgaFundo: cabinState.customFolgaFundo,
      baseChassisHidraulicoL: cabinState.baseChassisHidraulicoL,
      baseChassisHidraulicoSuspensao: cabinState.baseChassisHidraulicoSuspensao,
      baseChassisEletricoL: cabinState.baseChassisEletricoL,
      baseChassisEletricoSuspensaoLateral: cabinState.baseChassisEletricoSuspensaoLateral,
      baseChassisEletricoSuspensaoFundo: cabinState.baseChassisEletricoSuspensaoFundo,
    });
  }, [
    shaftConfig,
    cabinState.customMenorFolga,
    cabinState.customFolgaFrontal,
    cabinState.customFolgaFundo,
    cabinState.baseChassisHidraulicoL,
    cabinState.baseChassisHidraulicoSuspensao,
    cabinState.baseChassisEletricoL,
    cabinState.baseChassisEletricoSuspensaoLateral,
    cabinState.baseChassisEletricoSuspensaoFundo,
  ]);

  // Estado ativo da cabine (direto no modo cabine, ou derivado da cabine calculada no modo poço)
  const activeState = useMemo<ElevatorConfigState>(() => {
    if (configMode === 'cabine') {
      return cabinState;
    }

    // No modo poço: calcula a cabine que cabe dentro do poço informado
    let selectedCabin = shaftCabinCalculation.cabineMaxima;
    if (shaftConfig.selectedCabinKey && shaftCabinCalculation.cabinesPossiveis.length > 0) {
      const found = shaftCabinCalculation.cabinesPossiveis.find(
        (c) => `${c.larguraCabine}x${c.profundidadeCabine}` === shaftConfig.selectedCabinKey
      );
      if (found) {
        selectedCabin = found;
      }
    }

    const larguraCabine = selectedCabin?.larguraCabine ?? 800;
    const profundidadeCabine = selectedCabin?.profundidadeCabine ?? 1200;
    const ladoFace =
      (shaftConfig.ladoPorta || 'Largura') === 'Profundidade' ? profundidadeCabine : larguraCabine;
    const ladoEfetivo =
      shaftConfig.tipoEntrada === 'Adjacente' ? Math.min(larguraCabine, profundidadeCabine) : ladoFace;
    const aberturaPorta = selectedCabin?.maxAberturaPorta || getMaiorAberturaValida(ladoEfetivo);

    return {
      larguraCabine: larguraCabine.toString(),
      profundidadeCabine: profundidadeCabine.toString(),
      ladoPorta: shaftConfig.ladoPorta,
      aberturaPorta,
      acionamento: shaftConfig.acionamento,
      arcada: shaftConfig.arcada,
      posicao: shaftConfig.posicao,
      tipoPorta: shaftConfig.tipoPorta,
      tipoEntrada: shaftConfig.tipoEntrada,
      ladoArcada: shaftConfig.ladoArcada,
      // Preserva folgas personalizadas salvas
      customMenorFolga: cabinState.customMenorFolga,
      customFolgaFrontal: cabinState.customFolgaFrontal,
      customFolgaFundo: cabinState.customFolgaFundo,
      baseChassisHidraulicoL: cabinState.baseChassisHidraulicoL,
      baseChassisHidraulicoSuspensao: cabinState.baseChassisHidraulicoSuspensao,
      baseChassisEletricoL: cabinState.baseChassisEletricoL,
      baseChassisEletricoSuspensaoLateral: cabinState.baseChassisEletricoSuspensaoLateral,
      baseChassisEletricoSuspensaoFundo: cabinState.baseChassisEletricoSuspensaoFundo,
      basePorta2FL: cabinState.basePorta2FL,
      basePorta3FL: cabinState.basePorta3FL,
      basePorta2FC: cabinState.basePorta2FC,
      basePorta4FC: cabinState.basePorta4FC,
    };
  }, [configMode, cabinState, shaftCabinCalculation, shaftConfig]);

  // Resultados normativos e dimensionais
  const results = useMemo(() => {
    if (configMode === 'cabine') {
      return calculateElevator(cabinState);
    }

    return calculateElevator(activeState, {
      forcedLarguraPoco: shaftConfig.larguraPoco,
      forcedProfundidadePoco: shaftConfig.profundidadePoco,
      isCalculadoPorPoco: true,
    });
  }, [configMode, cabinState, activeState, shaftConfig.larguraPoco, shaftConfig.profundidadePoco]);

  const hasCustomClearances = useMemo(() => {
    return Boolean(
      cabinState.customMenorFolga !== undefined ||
      cabinState.customFolgaFrontal !== undefined ||
      cabinState.customFolgaFundo !== undefined ||
      cabinState.baseChassisHidraulicoL !== undefined ||
      cabinState.baseChassisHidraulicoSuspensao !== undefined ||
      cabinState.baseChassisEletricoL !== undefined ||
      cabinState.baseChassisEletricoSuspensaoLateral !== undefined ||
      cabinState.baseChassisEletricoSuspensaoFundo !== undefined ||
      cabinState.basePorta2FL !== undefined ||
      cabinState.basePorta3FL !== undefined ||
      cabinState.basePorta2FC !== undefined ||
      cabinState.basePorta4FC !== undefined
    );
  }, [cabinState]);

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      let blueprintDataUrl: string | undefined = undefined;
      const canvasEl = document.getElementById(
        'elevator-blueprint-canvas'
      ) as HTMLCanvasElement | null;
      if (canvasEl) {
        try {
          blueprintDataUrl = canvasEl.toDataURL('image/png');
        } catch (e) {
          console.warn('Canvas capture error:', e);
        }
      }
      await generateElevatorPdf({
        state: activeState,
        results,
        blueprintDataUrl,
        companySettings,
      });
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {companySettings.logoDataUrl ? (
              <button
                type="button"
                onClick={() => setIsSystemSettingsOpen(true)}
                title="Logotipo da Empresa (Clique para alterar nas Configurações do Sistema)"
                className="h-10 max-w-[130px] sm:max-w-[180px] bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 px-2 py-1 rounded-xl flex items-center justify-center overflow-hidden shadow-sm cursor-pointer transition-all group shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companySettings.logoDataUrl}
                  alt={companySettings.companyName || 'Logo da Empresa'}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                />
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[170px] sm:max-w-[280px]">
                  {companySettings.companyName || 'Configurador de Elevador'}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 rounded-full font-mono">
                  {companySettings.logoDataUrl ? 'Personalizado' : 'v2.0 Web CAD'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate max-w-[320px]">
                {companySettings.subtitle || 'Dimensionamento de poço, cabine e arcada com planta baixa técnica'}
              </p>
            </div>
          </div>

          {/* Quick info badges */}
          <div className="flex items-center gap-3">
            {hasCustomClearances && (
              <div
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-mono shadow-sm"
                title="Folgas técnicas personalizadas pelo usuário salvas e ativas no programa"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">Folgas Salvas Ativas</span>
              </div>
            )}

            <div className="hidden lg:flex items-center gap-3.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Poço:</span>
                <span className="text-cyan-400 font-bold">
                  {results.larguraPoco} × {results.profundidadePoco} mm
                </span>
              </div>
              <div className="w-[1px] h-3 bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Cabine:</span>
                <span className="text-slate-200">
                  {activeState.larguraCabine} × {activeState.profundidadeCabine} mm
                </span>
              </div>
              <div className="w-[1px] h-3 bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Lotação:</span>
                <span className="text-emerald-400 font-bold">
                  {results.numeroPassageiros} Pass.
                </span>
              </div>
              <div className="w-[1px] h-3 bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Carga:</span>
                <span className="text-amber-400 font-bold">
                  {results.cargaUtilKg} kg
                </span>
              </div>
            </div>

            {/* Header Configurações do Sistema Button */}
            <button
              id="btn-header-system-settings"
              type="button"
              onClick={() => setIsSystemSettingsOpen(true)}
              title="Configurações do Sistema, Logotipo e Marca d'Água"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border bg-slate-900 border-slate-800 text-slate-200 hover:text-cyan-400 hover:bg-slate-800 hover:border-slate-700 shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Configurações do Sistema</span>
              <span className="sm:hidden">Sistema</span>
              {companySettings.logoDataUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" title="Logotipo ativo" />
              )}
            </button>

            {/* Header Calcular por Poço Button */}
            <button
              id="btn-header-calc-poco"
              type="button"
              onClick={() => {
                setConfigMode(configMode === 'poco' ? 'cabine' : 'poco');
                setMobileTab('config');
              }}
              title="Dimensionamento Inverso: Informar tamanho do poço e calcular cabines em múltiplos de 50 mm"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                configMode === 'poco'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Calcular por Poço</span>
              <span className="sm:hidden">Poço</span>
              <span className="hidden md:inline px-1 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono">
                50mm
              </span>
            </button>

            {/* Header Gerar PDF Button */}
            <button
              id="btn-header-pdf"
              type="button"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              title="Gerar e baixar relatório técnico completo em PDF (ABNT NBR 16858-1)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Gerando...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gerar PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </button>

            {/* Mobile View Switcher */}
            <div className="flex lg:hidden bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setMobileTab('config')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  mobileTab === 'config'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Parâmetros</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('blueprint')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  mobileTab === 'blueprint'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Planta Baixa</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Parameters & Calculated Results (5 cols on lg) */}
          <div
            className={`lg:col-span-5 flex flex-col gap-5 ${
              mobileTab === 'blueprint' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <ConfigPanel
              state={cabinState}
              onChange={setCabinState}
              configMode={configMode}
              onConfigModeChange={setConfigMode}
              onOpenSystemSettings={() => setIsSystemSettingsOpen(true)}
              shaftConfig={shaftConfig}
              onShaftConfigChange={setShaftConfig}
            />
            <ResultsPanel
              state={activeState}
              results={results}
              onViewBlueprint={() => {
                setMobileTab('blueprint');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenShaftCalculator={() => {
                setConfigMode('poco');
                setMobileTab('config');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Standard & Reference Note */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-slate-300">
                  Normas de Referência & Engenharia:
                </span>
                <p className="leading-relaxed">
                  Lotação de passageiros e carga útil nominal dimensionadas rigorosamente
                  conforme a <strong className="text-slate-300">ABNT NBR 16858-1:2020</strong> (Tabela 6 - Carga Nominal vs Área Máxima e Tabela 7 - Número de Passageiros).
                  Folgas estruturais da caixa de corrida e caixilhos conforme NBR NM 207 / NM 313.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Blueprint Canvas (7 cols on lg) */}
          <div
            className={`lg:col-span-7 flex flex-col gap-4 lg:sticky lg:top-20 ${
              mobileTab === 'config' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="h-[600px] sm:h-[680px] lg:h-[740px] w-full">
              <BlueprintCanvas
                state={activeState}
                results={results}
                activeTab={mobileTab}
                onOpenBlueprintTab={() => setMobileTab('blueprint')}
              />
            </div>

            {/* Quick summary cards underneath drawing */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Lotação
                </span>
                <span className="text-xs font-semibold text-emerald-400 mt-0.5 block truncate">
                  {results.numeroPassageiros} Passageiros
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Carga Útil (Q)
                </span>
                <span className="text-xs font-semibold text-amber-400 mt-0.5 block">
                  {results.cargaUtilKg} kg
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Acionamento
                </span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
                  {activeState.acionamento}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Arcada / Sling
                </span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5 block truncate">
                  {activeState.arcada === 'L' ? 'Tipo L' : 'Suspensão'}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Entrada
                </span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
                  {activeState.tipoEntrada}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Porta
                </span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5 block truncate">
                  {activeState.tipoPorta} ({activeState.aberturaPorta}mm)
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Configurador de Elevador — Convertido para Web a partir do projeto Android (macoraty/elev)
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Poço & Cabine</span>
            <span>•</span>
            <span>Chassis & Contrapeso</span>
            <span>•</span>
            <span>Planta Baixa CAD</span>
          </div>
        </div>
      </footer>
      {/* Modal de Configurações do Sistema e Logotipo */}
      <SystemSettingsModal
        isOpen={isSystemSettingsOpen}
        onClose={() => setIsSystemSettingsOpen(false)}
        onSettingsSaved={(newSettings) => setCompanySettings(newSettings)}
      />
    </div>
  );
}
