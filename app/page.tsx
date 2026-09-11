'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ElevatorConfigState,
  INITIAL_STATE,
  calculateElevator,
} from '@/lib/elevator-calculator';
import { generateElevatorPdf } from '@/lib/elevator-pdf';
import { loadClearancesFromStorage } from '@/lib/clearances-storage';
import { ConfigPanel } from '@/components/config-panel';
import { ResultsPanel } from '@/components/results-panel';
import { BlueprintCanvas } from '@/components/blueprint-canvas';
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
} from 'lucide-react';

export default function ElevatorConfiguratorPage() {
  const [state, setState] = useState<ElevatorConfigState>(INITIAL_STATE);
  const [mobileTab, setMobileTab] = useState<'config' | 'blueprint'>('config');
  const [configMode, setConfigMode] = useState<'cabine' | 'poco'>('cabine');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Carrega as folgas técnicas salvas no navegador pelo usuário ao iniciar o programa
  useEffect(() => {
    const saved = loadClearancesFromStorage();
    if (saved) {
      const timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          ...saved,
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const results = useMemo(() => {
    return calculateElevator(state);
  }, [state]);

  const hasCustomClearances = useMemo(() => {
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
      await generateElevatorPdf({ state, results, blueprintDataUrl });
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
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Configurador de Elevador
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 rounded-full font-mono">
                  v2.0 Web CAD
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Dimensionamento de poço, cabine e arcada com planta baixa técnica interativa
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
                  {state.larguraCabine} × {state.profundidadeCabine} mm
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
              state={state}
              onChange={setState}
              configMode={configMode}
              onConfigModeChange={setConfigMode}
            />
            <ResultsPanel
              state={state}
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
                state={state}
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
                  {state.acionamento}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Arcada / Sling
                </span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5 block truncate">
                  {state.arcada === 'L' ? 'Tipo L' : 'Suspensão'}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Entrada
                </span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
                  {state.tipoEntrada}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Porta
                </span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5 block truncate">
                  {state.tipoPorta} ({state.aberturaPorta}mm)
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
    </div>
  );
}
