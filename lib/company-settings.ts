export interface CompanySettings {
  companyName: string;
  subtitle: string;
  cnpj: string;
  phone: string;
  email: string;
  engineerName: string;
  engineerCrea: string;
  logoDataUrl: string; // Base64 data URL
  enableWatermark: boolean;
  watermarkOpacity: number; // 0.05 to 0.30, default 0.12
}

export const COMPANY_SETTINGS_STORAGE_KEY = 'elevator_company_settings_v1';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: '',
  subtitle: '',
  cnpj: '',
  phone: '',
  email: '',
  engineerName: '',
  engineerCrea: '',
  logoDataUrl: '',
  enableWatermark: true,
  watermarkOpacity: 0.12,
};

/**
 * Carrega as configurações da empresa e logo do localStorage
 */
export function loadCompanySettingsFromStorage(): CompanySettings {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_SETTINGS;
  try {
    const raw = localStorage.getItem(COMPANY_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_COMPANY_SETTINGS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        ...DEFAULT_COMPANY_SETTINGS,
        ...parsed,
      };
    }
    return DEFAULT_COMPANY_SETTINGS;
  } catch (err) {
    console.warn('Erro ao carregar configurações da empresa do localStorage:', err);
    return DEFAULT_COMPANY_SETTINGS;
  }
}

/**
 * Salva as configurações da empresa e logo no localStorage
 */
export function saveCompanySettingsToStorage(settings: CompanySettings): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(COMPANY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    // Dispara evento customizado para sincronizar componentes em tempo real
    window.dispatchEvent(new Event('company-settings-updated'));
    return true;
  } catch (err) {
    console.warn('Erro ao salvar configurações da empresa no localStorage:', err);
    return false;
  }
}

/**
 * Remove o logo e as configurações salvas da empresa
 */
export function clearCompanySettingsFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.removeItem(COMPANY_SETTINGS_STORAGE_KEY);
    window.dispatchEvent(new Event('company-settings-updated'));
    return true;
  } catch (err) {
    console.warn('Erro ao remover configurações da empresa do localStorage:', err);
    return false;
  }
}

/**
 * Verifica se há um logo personalizado carregado
 */
export function hasCustomCompanyLogo(settings?: CompanySettings): boolean {
  if (settings) {
    return Boolean(settings.logoDataUrl && settings.logoDataUrl.trim().length > 0);
  }
  const current = loadCompanySettingsFromStorage();
  return Boolean(current.logoDataUrl && current.logoDataUrl.trim().length > 0);
}

/**
 * Cria uma versão semi-transparente do logo para uso como marca d'água no PDF e Imagens
 */
export async function createWatermarkDataUrl(
  logoDataUrl: string,
  opacity: number = 0.12
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !logoDataUrl) {
      resolve('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(logoDataUrl);
          return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = Math.max(0.02, Math.min(1, opacity));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        console.warn('Erro ao processar transparência da marca d água:', e);
        resolve(logoDataUrl);
      }
    };
    img.onerror = () => {
      resolve(logoDataUrl);
    };
    img.src = logoDataUrl;
  });
}

/**
 * Gera um logo padrão de exemplo para testes imediatos
 */
export function generateSampleLogoDataUrl(companyName: string = 'ELEVADORES ALPHA'): string {
  if (typeof window === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fundo transparente com borda arredondada sutil
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(0, 0, 600, 200, 24);
  ctx.fill();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Ícone estilizado de elevador / cabine à esquerda
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(40, 40, 90, 120);
  ctx.fillStyle = '#081426';
  ctx.fillRect(52, 52, 66, 96);
  // Cabos de aço
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(85, 20);
  ctx.lineTo(85, 52);
  ctx.stroke();
  // Setas de subida e descida
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.moveTo(85, 70);
  ctx.lineTo(72, 86);
  ctx.lineTo(98, 86);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(85, 130);
  ctx.lineTo(72, 114);
  ctx.lineTo(98, 114);
  ctx.closePath();
  ctx.fill();

  // Texto da Empresa
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(companyName.toUpperCase(), 160, 80);

  // Subtítulo
  ctx.fillStyle = '#38bdf8';
  ctx.font = '600 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('ENGENHARIA & TRANSPORTE VERTICAL', 160, 126);

  return canvas.toDataURL('image/png');
}
