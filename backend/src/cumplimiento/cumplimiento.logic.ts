export type EstadoCumplimientoValor = 'LOGRADO' | 'EN_RIESGO' | 'CRITICO';
export type EstadoLegacy = 'logrado' | 'riesgo' | 'critico';

export interface ParametrosCumplimiento {
  tipo?: string | null;
  inverso?: boolean | null;
  meta: number;
  real: number;
  rangoMin?: number | null;
  rangoMax?: number | null;
  umbralCumplido?: number | null;
  umbralAlerta?: number | null;
  decimales?: number | null;
}

export interface ReglasConfig {
  umbralCumplido?: number | null;
  umbralAlerta?: number | null;
  decimalesReporte?: number | null;
  formatoPorcentaje?: string | null;
  limitarPorcentaje?: boolean | null;
}

export interface ResultadoCumplimiento {
  meta: number;
  real: number;
  bruto: number;
  mostrado: number;
  porcentaje: string;
  estado: EstadoCumplimientoValor;
  estadoKey: EstadoLegacy;
  valido: boolean;
  formula: string;
}

function numero(valor: unknown): number {
  if (valor === null || valor === undefined) return 0;
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function redondear(valor: number, decimales: number): number {
  const factor = 10 ** decimales;
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

export function decimalesEfectivos(
  parametros: ParametrosCumplimiento,
  reglas?: ReglasConfig | null,
): number {
  const propios = parametros.decimales;
  if (propios !== null && propios !== undefined) {
    return Math.min(6, Math.max(0, Math.trunc(numero(propios))));
  }
  if (reglas?.formatoPorcentaje === 'ENTERO') return 0;
  const configurados = reglas?.decimalesReporte;
  if (configurados !== null && configurados !== undefined) {
    return Math.min(6, Math.max(0, Math.trunc(numero(configurados))));
  }
  return 2;
}

export function calcularCumplimiento(
  parametros: ParametrosCumplimiento,
  reglas?: ReglasConfig | null,
): ResultadoCumplimiento {
  const meta = numero(parametros.meta);
  const real = numero(parametros.real);
  const tipo = parametros.tipo ?? (parametros.inverso ? 'MENOR_MEJOR' : 'MAYOR_MEJOR');
  let bruto = 0;
  let valido = true;
  let formula = '';

  if (tipo === 'RANGO' && parametros.rangoMin != null && parametros.rangoMax != null) {
    const min = numero(parametros.rangoMin);
    const max = numero(parametros.rangoMax);
    formula = `rango [${min}, ${max}]`;
    if (max < min) {
      valido = false;
      bruto = 0;
    } else if (real >= min && real <= max) {
      bruto = 100;
    } else if (real < min) {
      bruto = min === 0 ? 0 : (real / min) * 100;
      valido = min !== 0;
    } else {
      bruto = real === 0 ? 100 : (max / real) * 100;
    }
  } else if (tipo === 'MENOR_MEJOR' || parametros.inverso) {
    formula = 'meta / real * 100';
    if (real === 0) {
      bruto = meta >= 0 ? 100 : 0;
      valido = meta >= 0;
    } else if (meta <= 0) {
      bruto = 0;
      valido = false;
    } else {
      bruto = (meta / real) * 100;
    }
  } else {
    formula = 'real / meta * 100';
    if (meta === 0) {
      bruto = real === 0 ? 100 : 0;
      valido = real === 0;
    } else if (meta < 0) {
      bruto = 0;
      valido = false;
    } else {
      bruto = (real / meta) * 100;
    }
  }

  bruto = Number.isFinite(bruto) ? Math.max(0, bruto) : 0;
  const decimales = decimalesEfectivos(parametros, reglas);
  let mostrado = redondear(bruto, decimales);
  if (reglas?.limitarPorcentaje) mostrado = Math.min(100, mostrado);

  const umbralCumplido = numero(parametros.umbralCumplido ?? reglas?.umbralCumplido ?? 90);
  const umbralAlerta = numero(parametros.umbralAlerta ?? reglas?.umbralAlerta ?? 75);
  const estado = clasificarEstado(bruto, umbralCumplido, umbralAlerta);

  return {
    meta,
    real,
    bruto,
    mostrado,
    porcentaje: `${mostrado.toFixed(decimales)}%`,
    estado,
    estadoKey: estadoAKey(estado),
    valido,
    formula,
  };
}

export function clasificarEstado(
  cumplimiento: number,
  umbralCumplido = 90,
  umbralAlerta = 75,
): EstadoCumplimientoValor {
  if (cumplimiento >= umbralCumplido) return 'LOGRADO';
  if (cumplimiento >= umbralAlerta) return 'EN_RIESGO';
  return 'CRITICO';
}

export function estadoAKey(estado: EstadoCumplimientoValor): EstadoLegacy {
  if (estado === 'LOGRADO') return 'logrado';
  if (estado === 'EN_RIESGO') return 'riesgo';
  return 'critico';
}

export function agregarCumplimientos(
  filas: { cumplimiento: number; ponderacion?: number | null }[],
  regla: string | null | undefined,
): number {
  if (filas.length === 0) return 0;
  const valores = filas.map((f) => numero(f.cumplimiento));
  switch ((regla ?? 'PROMEDIO').toUpperCase()) {
    case 'MINIMO':
      return redondear(Math.min(...valores), 2);
    case 'PONDERADO': {
      const pesos = filas.map((f) => numero(f.ponderacion));
      const total = pesos.reduce((acc, p) => acc + p, 0);
      if (total <= 0) {
        return redondear(valores.reduce((acc, v) => acc + v, 0) / valores.length, 2);
      }
      const ponderado = valores.reduce((acc, v, i) => acc + v * pesos[i], 0) / total;
      return redondear(ponderado, 2);
    }
    case 'PROMEDIO':
    default:
      return redondear(valores.reduce((acc, v) => acc + v, 0) / valores.length, 2);
  }
}

export function agregarPeriodos(
  valores: number[],
  regla: string | null | undefined,
): number {
  if (valores.length === 0) return 0;
  switch ((regla ?? 'ULTIMO').toUpperCase()) {
    case 'SUMA':
    case 'ACUMULADO':
      return redondear(valores.reduce((acc, v) => acc + v, 0), 4);
    case 'PROMEDIO':
      return redondear(valores.reduce((acc, v) => acc + v, 0) / valores.length, 4);
    case 'ULTIMO':
    default:
      return redondear(valores[valores.length - 1], 4);
  }
}

export function validarUmbrales(umbralAlerta: number, umbralCumplido: number): boolean {
  return (
    Number.isFinite(umbralAlerta) &&
    Number.isFinite(umbralCumplido) &&
    umbralAlerta >= 0 &&
    umbralCumplido <= 100 &&
    umbralAlerta <= umbralCumplido
  );
}
