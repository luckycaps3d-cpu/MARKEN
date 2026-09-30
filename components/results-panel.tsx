'use client';

import React, { useState } from 'react';
import {
  ElevatorConfigState,
  ElevatorCalculationResults,
} from '@/lib/elevator-calculator';
import { generateElevatorPdf } from '@/lib/elevator-pdf';
import {
  Calculator,
  Copy,
  Check,
  Users,
  Weight,
  ShieldCheck,
  Ruler,
  Maximize2,
  Info,
  FileDown,
  Loader2,
  Building2,
  AlertTriangle,
} from 'lucide-react';

interface ResultsPanelProps {
  state: ElevatorConfigState;
  results: ElevatorCalculationResults;
  onViewBlueprint?: () => void;
  onOpenShaftCalculator?: () => void;
}

export function ResultsPanel({
  state,
  results,
  onViewBlueprint,
  onOpenShaftCalculator,
}: ResultsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
          console.warn('Could not read canvas data URL:', e);
        }
      }

      await generateElevatorPdf({
        state,
        results,
        blueprintDataUrl,
      });
    } catch (err) {
      console.error('Erro ao gerar relatório em PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyReport = async () => {
    const report = `
=============================================
RELATÓRIO DE DIMENSIONAMENTO DE ELEVADOR
Norma de Segurança: ABNT NBR 16858-1:2020 / NM 313
=============================================
CAPACIDADE E CARGA ÚTIL (ABNT NBR 16858-1):
- Lotação Máxima Suportada: ${results.numeroPassageiros} passageiros
- Carga Útil Nominal (Q): ${results.cargaUtilKg} kg
- Carga Mínima Calculada (Tabela 6): ${results.cargaMinimaInterpoladaKg} kg
- Área Útil Real da Cabine: ${results.areaCabineM2.toFixed(2)} m²
- Área Máxima Permitida (Tabela 6): ${results.areaMaxPermitidaM2.toFixed(2)} m²
- Massa de Referência por Passageiro: 75 kg (Item 5.4.2.2)

DIMENSÕES DA CABINE E PORTA:
- Largura da Cabine: ${state.larguraCabine} mm
- Profundidade da Cabine: ${state.profundidadeCabine} mm
- Lado de Instalação da Porta: ${results.nomeLadoPorta}
- Vão Livre da Porta: ${state.aberturaPorta} mm
- Espaço para Montantes Frontais: 2x ${results.montanteFrontalMm} mm (Total: ${results.diferencaPortaLadoMm} mm)
- Validação Porta x Cabine: ${results.isPortaMenorQueLado ? 'CONFORME (Porta estritamente menor que a face da cabine)' : 'INCONSISTENTE (Porta >= face)'}

DIMENSIONAMENTO DO POÇO (CAIXA DE CORRIDA):
- LARGURA DO POÇO (LP): ${results.larguraPoco} mm
- PROFUNDIDADE DO POÇO (PP): ${results.profundidadePoco} mm

CONFIGURAÇÃO TÉCNICA:
- Acionamento: ${state.acionamento}
- Tipo de Arcada: ${state.arcada}
- Posição do Chassis: ${state.posicao}
- Tipo de Porta: ${state.tipoPorta}
- Tipo de Entrada: ${state.tipoEntrada}
- Lado da Arcada / Chassis: ${state.ladoArcada}

FOLGAS E SUPORTES ESTRUTURAIS:
- Folga Necessária (Porta): ${results.folgaPorta} mm
- Espaço Chassis (L/S): ${results.espacoChassis} mm
- Menor Folga Lateral: ${results.menorFolga} mm
- Folga Frontal: ${results.folgaFrontal} mm
- Tipo de Suporte: ${results.tipoSuporte}
- Quantidade por Andar: ${results.qtdSuporte} unidades
=============================================
Gerado via Configurador de Elevador Web (ABNT NBR 16858-1)
    `.trim();

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800/50 text-emerald-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-white">
              {results.isCalculadoPorPoco ? 'Memorial de Cálculo & Folgas Técnicas' : 'Resultados do Dimensionamento'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {results.isCalculadoPorPoco ? 'Detalhamento normativo e folgas estruturais da obra' : 'Capacidade, carga e medidas calculadas para a caixa de corrida'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-generate-pdf-header"
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Gerar e baixar relatório técnico em PDF (ABNT NBR 16858-1)"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Gerando...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </>
            )}
          </button>

          <button
            id="btn-copy-report"
            type="button"
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta Normativo no modo cabine (no modo poço já é exibido no card superior) */}
      {!results.isCalculadoPorPoco && results.isForaDaNorma && (
        <div className="mb-3 bg-amber-950/50 border border-amber-500/60 rounded-xl p-2.5 flex items-start gap-2.5 text-amber-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block uppercase">
              Aviso Normativo ABNT NBR 16858-1
            </span>
            <span className="text-amber-200/90 leading-tight block">
              Dimensões ({state.larguraCabine} × {state.profundidadeCabine} mm) inferiores ao padrão normativo mínimo (800 × 1200 mm). Projeto especial sob medida.
            </span>
          </div>
        </div>
      )}

      {/* 4 Cards Principais de Resultado (exibidos apenas no modo por cabine para não duplicar dados do modo poço) */}
      {!results.isCalculadoPorPoco && (
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          {/* Número de Passageiros */}
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
            <div className="flex items-center justify-between text-[10px] text-emerald-300 font-medium mb-0.5">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" />
                Passageiros
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900/60 text-emerald-200 font-mono">
                NBR 16858-1
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-100">
                {results.numeroPassageiros}
              </span>
              <span className="text-[10px] text-emerald-400">pass.</span>
            </div>
            <p className="text-[9px] text-slate-400">
              Área: {results.areaCabineM2.toFixed(2)} m²
            </p>
          </div>

          {/* Carga Útil Nominal */}
          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30">
            <div className="flex items-center justify-between text-[10px] text-amber-300 font-medium mb-0.5">
              <span className="flex items-center gap-1">
                <Weight className="w-3 h-3 text-amber-400" />
                Carga Útil (Q)
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-900/60 text-amber-200 font-mono">
                Tabela 6
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-bold font-mono text-amber-100">
                {results.cargaUtilKg}
              </span>
              <span className="text-[10px] text-amber-400 font-mono">kg</span>
            </div>
            <p className="text-[9px] text-slate-400">
              Mínimo: {results.cargaMinimaInterpoladaKg} kg
            </p>
          </div>

          {/* Largura do Poço */}
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
            <div className="flex items-center justify-between text-[10px] text-cyan-300 font-medium mb-0.5">
              <span>Largura Poço (LP)</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-200 font-mono">
                Eixo X
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-bold font-mono text-cyan-100">
                {results.larguraPoco}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">mm</span>
            </div>
            <p className="text-[9px] text-slate-400 truncate">
              Cabine ({state.larguraCabine}) + Chassis + Folgas
            </p>
          </div>

          {/* Profundidade do Poço */}
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
            <div className="flex items-center justify-between text-[10px] text-cyan-300 font-medium mb-0.5">
              <span>Profundidade (PP)</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-200 font-mono">
                Eixo Y
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-bold font-mono text-cyan-100">
                {results.profundidadePoco}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">mm</span>
            </div>
            <p className="text-[9px] text-slate-400 truncate">
              Cabine ({state.profundidadeCabine}) + Folgas
            </p>
          </div>
        </div>
      )}

      {/* Atalho para Dimensionamento Inverso por Poço (Apenas se não estiver no modo poço) */}
      {onOpenShaftCalculator && !results.isCalculadoPorPoco && (
        <div className="mb-2.5 p-2 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 text-[11px] block">
                Dimensionar pelo Poço Existente?
              </span>
              <span className="text-[10px] text-slate-400">
                Calcule cabines em múltiplos de 50 mm.
              </span>
            </div>
          </div>
          <button
            id="btn-open-shaft-calc"
            type="button"
            onClick={onOpenShaftCalculator}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] rounded transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            Modo Poço
          </button>
        </div>
      )}

      {/* Technical Breakdown: Capacidade ABNT NBR 16858-1 */}
      <div className="mb-2 bg-slate-950/60 border border-emerald-900/40 rounded-xl p-2.5 text-xs">
        <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-slate-800/80 text-emerald-400 font-semibold text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Dimensionamento de Lotação (ABNT NBR 16858-1:2020)</span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
            <span className="text-slate-400">Área Útil da Cabine</span>
            <span className="font-mono font-semibold text-slate-200">
              {results.areaCabineM2.toFixed(2)} m²
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
            <span className="text-slate-400">Lotação de Passageiros (Tabela 7)</span>
            <span className="font-mono font-semibold text-emerald-400">
              {results.numeroPassageiros} pessoas
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
            <span className="text-slate-400">Carga Útil Nominal Recomendada (Q)</span>
            <span className="font-mono font-semibold text-amber-300">
              {results.cargaUtilKg} kg
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
            <span className="text-slate-400">Carga Mínima Exigida (Tabela 6)</span>
            <span className="font-mono text-slate-300">
              {results.cargaMinimaInterpoladaKg} kg
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
            <span className="text-slate-400">Área Máxima Permitida (Tabela 6)</span>
            <span className="font-mono text-slate-300">
              {results.areaMaxPermitidaM2.toFixed(2)} m²
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-slate-400">Massa Média por Passageiro</span>
            <span className="font-mono text-slate-300">
              75 kg / pessoa (Item 5.4.2.2)
            </span>
          </div>
        </div>
      </div>

      {/* Technical Breakdown: Arquitetura da Porta e Montantes da Cabine */}
      <div className="mb-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-xs">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 font-semibold text-[11px]">
          <span className="text-cyan-400 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" />
            Arquitetura de Porta e Montantes de Cabine
          </span>
          {results.isPortaMenorQueLado ? (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              ✓ Conforme
            </span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
              ⚠️ Inconsistente
            </span>
          )}
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
            <span className="text-slate-400">Face de Instalação da Porta</span>
            <span className="font-mono font-semibold text-slate-200">
              {results.nomeLadoPorta}
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
            <span className="text-slate-400">Vão Livre de Abertura</span>
            <span className="font-mono font-semibold text-cyan-300">
              {state.aberturaPorta} mm
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
            <span className="text-slate-400">Montantes Frontais (Retornos)</span>
            <span className="font-mono font-semibold text-emerald-400">
              2× {results.montanteFrontalMm} mm (Total: {results.diferencaPortaLadoMm} mm)
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-slate-400">Regra Construtiva</span>
            <span className="text-slate-300">
              {results.isPortaMenorQueLado
                ? `Porta (${state.aberturaPorta} mm) < Face (${results.ladoFacePortaMm} mm)`
                : `ERRO: Porta (${state.aberturaPorta} mm) ≥ Face (${results.ladoFacePortaMm} mm)`}
            </span>
          </div>
        </div>
      </div>

      {/* Technical Breakdown: Folgas e Caixa de Corrida */}
      <div className="space-y-1 bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 text-[11px]">
        <div className="text-slate-300 font-semibold pb-1 border-b border-slate-800/60">
          Folgas e Componentes Estruturais
        </div>
        <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
          <span className="text-slate-400">Folga Necessária (Porta)</span>
          <span className="font-mono font-semibold text-slate-200">
            {results.folgaPorta} mm
          </span>
        </div>

        <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
          <span className="text-slate-400">Espaço Chassis (L / S)</span>
          <span className="font-mono font-semibold text-slate-200">
            {results.espacoChassis} mm
          </span>
        </div>

        <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
          <span className="text-slate-400">Menor Folga de Segurança</span>
          <span className="font-mono font-semibold text-slate-200">
            {results.menorFolga} mm
          </span>
        </div>

        <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
          <span className="text-slate-400">Tipo de Suporte de Guia</span>
          <span className="font-medium text-cyan-300">{results.tipoSuporte}</span>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-400">Quantidade de Suportes por Andar</span>
          <span className="font-mono font-semibold text-emerald-400">
            {results.qtdSuporte} unidades
          </span>
        </div>
      </div>

      {/* Action Buttons: PDF and Blueprint */}
      <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-col gap-2">
        <button
          id="btn-generate-pdf-full"
          type="button"
          onClick={handleGeneratePdf}
          disabled={isGeneratingPdf}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gerando Relatório Técnico em PDF...</span>
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              <span>Gerar Relatório Técnico Completo em PDF</span>
            </>
          )}
        </button>

        {onViewBlueprint && (
          <button
            id="btn-view-blueprint-results"
            type="button"
            onClick={onViewBlueprint}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-cyan-200 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ver Planta Baixa e Baixar Desenho Técnico</span>
          </button>
        )}
      </div>
    </div>
  );
}
