import { ElevatorConfigState } from './elevator-calculator';

export const CLEARANCES_STORAGE_KEY = 'elevator_user_clearances_v1';

export const CLEARANCE_KEYS: (keyof ElevatorConfigState)[] = [
  'aberturaPorta',
  'customMenorFolga',
  'customFolgaFrontal',
  'customFolgaFundo',
  'baseChassisHidraulicoL',
  'baseChassisHidraulicoSuspensao',
  'baseChassisEletricoL',
  'baseChassisEletricoSuspensaoLateral',
  'baseChassisEletricoSuspensaoFundo',
  'basePorta2FL',
  'basePorta3FL',
  'basePorta2FC',
  'basePorta4FC',
];

export type SavedClearances = Partial<Pick<ElevatorConfigState, (typeof CLEARANCE_KEYS)[number]>>;

/**
 * Extrai apenas os campos de folga técnica do estado
 */
export function extractClearances(state: Partial<ElevatorConfigState>): SavedClearances {
  const result: SavedClearances = {};
  for (const key of CLEARANCE_KEYS) {
    if (state[key] !== undefined) {
      // @ts-expect-error - index assignment
      result[key] = state[key];
    }
  }
  return result;
}

/**
 * Salva as folgas técnicas no localStorage do navegador para persistência permanente no programa
 */
export function saveClearancesToStorage(state: Partial<ElevatorConfigState>): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const clearances = extractClearances(state);
    localStorage.setItem(CLEARANCES_STORAGE_KEY, JSON.stringify(clearances));
    return true;
  } catch (err) {
    console.warn('Erro ao salvar folgas no localStorage:', err);
    return false;
  }
}

/**
 * Carrega as folgas técnicas salvas no localStorage
 */
export function loadClearancesFromStorage(): SavedClearances | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CLEARANCES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('Erro ao ler folgas do localStorage:', err);
    return null;
  }
}

/**
 * Remove as folgas salvas do localStorage restaurando os padrões de fábrica
 */
export function clearClearancesFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.removeItem(CLEARANCES_STORAGE_KEY);
    return true;
  } catch (err) {
    console.warn('Erro ao remover folgas do localStorage:', err);
    return false;
  }
}

/**
 * Verifica se existem folgas personalizadas salvas pelo usuário
 */
export function hasSavedClearances(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(CLEARANCES_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;
    // Verifica se possui ao menos uma propriedade definida
    return Object.keys(parsed).some((k) => parsed[k] !== undefined && parsed[k] !== null);
  } catch {
    return false;
  }
}

/**
 * Mescla as folgas salvas em um estado existente
 */
export function applySavedClearancesToState(state: ElevatorConfigState): ElevatorConfigState {
  const saved = loadClearancesFromStorage();
  if (!saved) return state;
  return {
    ...state,
    ...saved,
  };
}
