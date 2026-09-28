'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CompanySettings,
  DEFAULT_COMPANY_SETTINGS,
  loadCompanySettingsFromStorage,
  saveCompanySettingsToStorage,
  clearCompanySettingsFromStorage,
  generateSampleLogoDataUrl,
} from '@/lib/company-settings';
import {
  Building2,
  Upload,
  Trash2,
  Check,
  X,
  FileDown,
  ShieldCheck,
  Eye,
  Sliders,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  Image as ImageIcon,
  Stamp,
  RotateCcw,
} from 'lucide-react';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (newSettings: CompanySettings) => void;
}

export function SystemSettingsModal({
  isOpen,
  onClose,
  onSettingsSaved,
}: SystemSettingsModalProps) {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    if (typeof window !== 'undefined') {
      return loadCompanySettingsFromStorage();
    }
    return DEFAULT_COMPANY_SETTINGS;
  });
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega configurações existentes quando o modal abre
  useEffect(() => {
    if (isOpen) {
      const current = loadCompanySettingsFromStorage();
      const timer = setTimeout(() => {
        setSettings(current);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSettings((prev) => ({
          ...prev,
          logoDataUrl: result,
          // Se o nome da empresa estiver vazio, tenta preencher com o nome do arquivo limpo
          companyName: prev.companyName || file.name.replace(/\.[^/.]+$/, '').toUpperCase(),
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({
      ...prev,
      logoDataUrl: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplySampleLogo = () => {
    const sampleLogo = generateSampleLogoDataUrl(
      settings.companyName || 'ELEVADORES ALPHA'
    );
    setSettings((prev) => ({
      ...prev,
      logoDataUrl: sampleLogo,
      companyName: prev.companyName || 'Elevadores Alpha Engenharia',
      subtitle: prev.subtitle || 'Transporte Vertical e Acessibilidade',
      engineerName: prev.engineerName || 'Eng. Roberto Albuquerque',
      engineerCrea: prev.engineerCrea || 'CREA-SP 506.123/D',
    }));
  };

  const handleSave = () => {
    saveCompanySettingsToStorage(settings);
    if (onSettingsSaved) {
      onSettingsSaved(settings);
    }
    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 900);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Deseja realmente restaurar as configurações padrão e remover o logotipo da empresa?')) {
      clearCompanySettingsFromStorage();
      setSettings(DEFAULT_COMPANY_SETTINGS);
      if (onSettingsSaved) {
        onSettingsSaved(DEFAULT_COMPANY_SETTINGS);
      }
      setIsSavedToast(true);
      setTimeout(() => {
        setIsSavedToast(false);
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Toast Notificação de Salvo */}
        {isSavedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
            <Check className="w-4 h-4 text-white" />
            Configurações e Logotipo salvos com sucesso no programa!
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/80 border border-cyan-800/60 rounded-xl text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Configurações do Sistema & Identidade Visual
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 rounded-full font-mono">
                  Personalização
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logotipo da sua empresa, marca d&apos;água em laudos/PDFs e dados para carimbos técnicos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Seção 1: Upload do Logotipo da Empresa */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Logotipo da Empresa</span>
              </div>
              <button
                type="button"
                onClick={handleApplySampleLogo}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium hover:underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Inserir Modelo Exemplo
              </button>
            </div>

            {settings.logoDataUrl ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-900 border border-slate-700/80 rounded-xl">
                {/* Visualizador do Logo */}
                <div className="relative w-full sm:w-60 h-28 bg-[#081426] border border-cyan-500/30 rounded-lg p-2 flex items-center justify-center overflow-hidden shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.logoDataUrl}
                    alt="Logo da Empresa"
                    className="max-w-full max-h-full object-contain"
                  />
                  <span className="absolute bottom-1 right-2 text-[9px] font-mono text-cyan-300/80 bg-slate-950/80 px-1.5 py-0.5 rounded">
                    Ativo no Programa
                  </span>
                </div>

                {/* Ações do Logo */}
                <div className="flex-1 flex flex-col gap-2 w-full">
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white">Logotipo carregado com sucesso!</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Este logo será exibido no topo da página do programa, no cabeçalho do PDF, como marca d&apos;água e no carimbo técnico.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Trocar Imagem
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 rounded-lg border border-rose-800/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover Logo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Dropzone para upload */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-900/80 text-slate-400'
                }`}
              >
                <div className="p-3 bg-slate-800/80 rounded-full mb-3 text-cyan-400">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-200 text-center">
                  Clique para selecionar ou arraste o logotipo da empresa aqui
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Formatos aceitos: PNG (com transparência recomendado), JPG, SVG, WebP
                </span>
              </div>
            )}

            {/* Input escondido */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Seção 2: Configurações da Marca d'Água (Watermark) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Stamp className="w-4 h-4 text-emerald-400" />
                <span>Marca d&apos;Água nos PDFs e Imagens</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableWatermark}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      enableWatermark: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-medium text-slate-300">
                  {settings.enableWatermark ? 'Ativada' : 'Desativada'}
                </span>
              </label>
            </div>

            <p className="text-xs text-slate-400">
              Quando ativada, o PDF e as imagens de planta baixa serão gerados com o logotipo da sua empresa centralizado como marca d&apos;água semi-transparente, protegendo e autenticando seu projeto técnico.
            </p>

            {/* Controle de Opacidade com Preview Visual */}
            {settings.enableWatermark && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    Intensidade / Opacidade da Marca d&apos;Água:
                  </span>
                  <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {Math.round(settings.watermarkOpacity * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0.04"
                  max="0.30"
                  step="0.01"
                  value={settings.watermarkOpacity}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      watermarkOpacity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />

                {/* Preview em Miniatura da Folha do PDF */}
                <div className="relative w-full h-28 bg-white rounded-lg border border-slate-700 overflow-hidden flex items-center justify-center p-3 select-none">
                  {/* Linhas simulando texto do memorial técnico */}
                  <div className="absolute inset-x-4 top-3 space-y-2 opacity-25 pointer-events-none">
                    <div className="h-2 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-1.5 bg-slate-500 rounded w-full"></div>
                    <div className="h-1.5 bg-slate-500 rounded w-4/5"></div>
                    <div className="h-1.5 bg-slate-500 rounded w-2/3"></div>
                  </div>

                  {/* Logotipo como Marca d'Água Central com a opacidade selecionada */}
                  {settings.logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.logoDataUrl}
                      alt="Preview Marca d'água"
                      className="max-h-20 max-w-[240px] object-contain transition-opacity"
                      style={{ opacity: settings.watermarkOpacity }}
                    />
                  ) : (
                    <div
                      className="font-bold font-mono tracking-widest text-slate-800 text-lg uppercase transition-opacity"
                      style={{ opacity: settings.watermarkOpacity * 1.5 }}
                    >
                      {settings.companyName || 'SUA EMPRESA'}
                    </div>
                  )}

                  <div className="absolute bottom-2 right-3 text-[10px] text-slate-500 font-mono">
                    Pré-visualização do fundo da folha A4
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 3: Dados Cadastrais da Empresa e Responsável Técnico */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Dados da Empresa e Responsável Técnico (Para Carimbo e Cabeçalhos)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-medium">
                  Nome da Empresa / Razão Social
                </label>
                <input
                  type="text"
                  placeholder="Ex: Elevadores Alpha do Brasil Ltda."
                  value={settings.companyName}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, companyName: e.target.value }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-medium">
                  Slogan / Subtítulo Técnico
                </label>
                <input
                  type="text"
                  placeholder="Ex: Engenharia de Transporte Vertical"
                  value={settings.subtitle}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-medium">
                  CNPJ / Inscrição
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={settings.cnpj}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, cnpj: e.target.value }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-medium">
                  Telefone / WhatsApp Comercial
                </label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={settings.phone}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-medium">
                  Engenheiro(a) Responsável Técnico
                </label>
                <input
                  type="text"
                  placeholder="Ex: Eng. Roberto Albuquerque"
                  value={settings.engineerName}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, engineerName: e.target.value }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-medium">
                  Registro Profissional (CREA / CAU)
                </label>
                <input
                  type="text"
                  placeholder="Ex: CREA-SP 506.123/D"
                  value={settings.engineerCrea}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, engineerCrea: e.target.value }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrões de Fábrica
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar e Aplicar no Programa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
