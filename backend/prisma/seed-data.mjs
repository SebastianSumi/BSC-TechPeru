export const PERSPECTIVAS = [
  { id: 'financiera', codigo: 'FIN', nombre: 'Financiera', descripcion: 'Resultados económicos y valor para los accionistas.', icono: '??', color: '#10b981', orden: 1, ponderacion: 30, activo: true },
  { id: 'clientes', codigo: 'CLI', nombre: 'Clientes', descripcion: 'Satisfacción, retención y crecimiento de clientes.', icono: '??', color: '#3b82f6', orden: 2, ponderacion: 30, activo: true },
  { id: 'procesos', codigo: 'PRO', nombre: 'Procesos Internos', descripcion: 'Eficiencia, calidad e innovación operativa.', icono: '??', color: '#f59e0b', orden: 3, ponderacion: 20, activo: true },
  { id: 'aprendizaje', codigo: 'APR', nombre: 'Aprendizaje y Crecimiento', descripcion: 'Talento, cultura y capacidades organizacionales.', icono: '??', color: '#8b5cf6', orden: 4, ponderacion: 20, activo: true },
]

// Objetivos estratégicos (12). El codigo coincide con el prefijo usado en KPIS[].objetivo.
export const OBJETIVOS = [
  { codigo: 'OBJ-F1', nombre: 'Incrementar la Rentabilidad', perspectivaId: 'financiera', ponderacion: 40, orden: 1, descripcion: 'Mejorar los márgenes y el retorno sobre el patrimonio.' },
  { codigo: 'OBJ-F2', nombre: 'Acelerar el Crecimiento de Ingresos', perspectivaId: 'financiera', ponderacion: 35, orden: 2, descripcion: 'Aumentar ventas y diversificar fuentes de ingreso.' },
  { codigo: 'OBJ-F3', nombre: 'Optimizar la Estructura de Costos', perspectivaId: 'financiera', ponderacion: 25, orden: 3, descripcion: 'Reducir costos operativos y de adquisición.' },
  { codigo: 'OBJ-C1', nombre: 'Maximizar la Satisfacción del Cliente', perspectivaId: 'clientes', ponderacion: 40, orden: 1, descripcion: 'Elevar la experiencia y satisfacción del cliente.' },
  { codigo: 'OBJ-C2', nombre: 'Aumentar la Retención y Fidelización', perspectivaId: 'clientes', ponderacion: 35, orden: 2, descripcion: 'Retener clientes y aumentar recompras.' },
  { codigo: 'OBJ-C3', nombre: 'Expandir la Base de Clientes', perspectivaId: 'clientes', ponderacion: 25, orden: 3, descripcion: 'Ampliar cobertura de mercado y nuevos clientes.' },
  { codigo: 'OBJ-P1', nombre: 'Excelencia en Operaciones y Calidad', perspectivaId: 'procesos', ponderacion: 40, orden: 1, descripcion: 'Optimizar entregas, calidad y productividad.' },
  { codigo: 'OBJ-P2', nombre: 'Innovación y Desarrollo de Producto', perspectivaId: 'procesos', ponderacion: 35, orden: 2, descripcion: 'Acelerar innovación y lanzamientos.' },
  { codigo: 'OBJ-P3', nombre: 'Gestión Eficiente de Proveedores', perspectivaId: 'procesos', ponderacion: 25, orden: 3, descripcion: 'Mejorar desempeño y costos de la cadena de suministro.' },
  { codigo: 'OBJ-A1', nombre: 'Desarrollar el Capital Humano', perspectivaId: 'aprendizaje', ponderacion: 40, orden: 1, descripcion: 'Fortalecer competencias y desarrollo del personal.' },
  { codigo: 'OBJ-A2', nombre: 'Fortalecer la Cultura y el Clima', perspectivaId: 'aprendizaje', ponderacion: 35, orden: 2, descripcion: 'Mejorar satisfacción, clima y reducir rotación.' },
  { codigo: 'OBJ-A3', nombre: 'Impulsar la Innovación Organizacional', perspectivaId: 'aprendizaje', ponderacion: 25, orden: 3, descripcion: 'Fomentar mejora continua e iniciativas del personal.' },
]

// Relaciones causa-efecto del mapa estratégico (aprendizaje -> procesos -> clientes -> financiera)
export const RELACIONES_CAUSALES = [
  { causa: 'OBJ-A1', efecto: 'OBJ-P1', descripcion: 'Personal capacitado mejora la calidad operativa.' },
  { causa: 'OBJ-A2', efecto: 'OBJ-P1', descripcion: 'Un buen clima reduce errores y defectos.' },
  { causa: 'OBJ-A3', efecto: 'OBJ-P2', descripcion: 'La innovación organizacional genera nuevos productos.' },
  { causa: 'OBJ-P1', efecto: 'OBJ-C1', descripcion: 'Operaciones de calidad elevan la satisfacción del cliente.' },
  { causa: 'OBJ-P2', efecto: 'OBJ-C3', descripcion: 'Nuevos productos atraen nuevos clientes.' },
  { causa: 'OBJ-P3', efecto: 'OBJ-F3', descripcion: 'Mejores proveedores reducen la estructura de costos.' },
  { causa: 'OBJ-C1', efecto: 'OBJ-C2', descripcion: 'Clientes satisfechos tienden a recompra y fidelidad.' },
  { causa: 'OBJ-C2', efecto: 'OBJ-F2', descripcion: 'La retención sostiene el crecimiento de ingresos.' },
  { causa: 'OBJ-C3', efecto: 'OBJ-F2', descripcion: 'Más clientes incrementan los ingresos.' },
  { causa: 'OBJ-F3', efecto: 'OBJ-F1', descripcion: 'Optimizar costos mejora la rentabilidad.' },
  { causa: 'OBJ-F2', efecto: 'OBJ-F1', descripcion: 'Mayores ingresos elevan la rentabilidad.' },
]

// Frecuencia por defecto segun el tipo de indicador (heuristica para la demo)
export const FRECUENCIA_POR_PERSPECTIVA = {
  financiera: 'TRIMESTRAL',
  clientes: 'TRIMESTRAL',
  procesos: 'MENSUAL',
  aprendizaje: 'SEMESTRAL',
}

export const KPIS = [
  { id: 'F1.1', perspectivaId: 'financiera', objetivo: 'OBJ-F1: Incrementar la Rentabilidad', nombre: 'ROE – Retorno sobre Patrimonio', unidad: '%', meta: 18, real: 16.5, inverso: false, accion: 'ROE por debajo del 18% meta. Revisar estructura de capital y palanca financiera.', orden: 1 },
  { id: 'F1.2', perspectivaId: 'financiera', objetivo: 'OBJ-F1: Incrementar la Rentabilidad', nombre: 'Margen EBITDA', unidad: '%', meta: 22, real: 19.8, inverso: false, accion: 'Margen comprimido por costos operativos. Plan de reducción de gastos en Q3-Q4.', orden: 2 },
  { id: 'F1.3', perspectivaId: 'financiera', objetivo: 'OBJ-F1: Incrementar la Rentabilidad', nombre: 'Utilidad Neta Anual', unidad: 'S/ MM', meta: 2.1, real: 1.87, inverso: false, accion: 'Utilidad neta al 89% de la meta. Requiere incremento de márgenes o volumen.', orden: 3 },
  { id: 'F2.1', perspectivaId: 'financiera', objetivo: 'OBJ-F2: Acelerar el Crecimiento de Ingresos', nombre: 'Crecimiento de Ventas YoY', unidad: '%', meta: 15, real: 12.3, inverso: false, accion: 'Crecimiento al 82% de la meta. Acelerar pipeline comercial y campañas de upsell.', orden: 4 },
  { id: 'F2.2', perspectivaId: 'financiera', objetivo: 'OBJ-F2: Acelerar el Crecimiento de Ingresos', nombre: 'Ingresos Totales Anuales', unidad: 'S/ MM', meta: 8.5, real: 7.9, inverso: false, accion: 'Ingresos 7.2% por debajo de meta. Revisar estrategia de precios y mix de productos.', orden: 5 },
  { id: 'F2.3', perspectivaId: 'financiera', objetivo: 'OBJ-F2: Acelerar el Crecimiento de Ingresos', nombre: 'Ingresos por Nuevos Productos', unidad: '%', meta: 20, real: 15.6, inverso: false, accion: 'Nuevos productos aportan 15.6% vs. 20% meta. Acelerar lanzamiento de Pipeline Q3.', orden: 6 },
  { id: 'F3.1', perspectivaId: 'financiera', objetivo: 'OBJ-F3: Optimizar la Estructura de Costos', nombre: 'Ratio Costo Operativo / Ingreso', unidad: '%', meta: 55, real: 58.2, inverso: true, accion: 'Ratio de costo elevado (58.2% vs 55% meta). Automatizar procesos para reducir costos.', orden: 7 },
  { id: 'F3.2', perspectivaId: 'financiera', objetivo: 'OBJ-F3: Optimizar la Estructura de Costos', nombre: 'Costo de Adquisición de Cliente (CAC)', unidad: 'S/', meta: 350, real: 412, inverso: true, accion: 'CAC de S/412 vs S/350 meta. Optimizar canales de adquisición digital.', orden: 8 },
  { id: 'F3.3', perspectivaId: 'financiera', objetivo: 'OBJ-F3: Optimizar la Estructura de Costos', nombre: 'Retorno sobre Activos (ROA)', unidad: '%', meta: 9, real: 7.8, inverso: false, accion: 'ROA bajo meta. Revisar eficiencia de activos y desinversión de activos ociosos.', orden: 9 },

  { id: 'C1.1', perspectivaId: 'clientes', objetivo: 'OBJ-C1: Maximizar la Satisfacción del Cliente', nombre: 'NPS – Net Promoter Score', unidad: 'pts', meta: 65, real: 58, inverso: false, accion: 'NPS de 58 (meta 65). Implementar programa de seguimiento post-venta en 30/60/90 días.', orden: 1 },
  { id: 'C1.2', perspectivaId: 'clientes', objetivo: 'OBJ-C1: Maximizar la Satisfacción del Cliente', nombre: 'CSAT – Satisfacción post-venta', unidad: '%', meta: 88, real: 84, inverso: false, accion: 'CSAT al 95.5% de meta. Reforzar proceso de onboarding y soporte técnico.', orden: 2 },
  { id: 'C1.3', perspectivaId: 'clientes', objetivo: 'OBJ-C1: Maximizar la Satisfacción del Cliente', nombre: 'Tiempo de Resolución de Quejas', unidad: 'días', meta: 2, real: 2.8, inverso: true, accion: 'Tiempo de resolución 2.8 días vs. 2 días meta. Crear equipo dedicado de soporte nivel 2.', orden: 3 },
  { id: 'C2.1', perspectivaId: 'clientes', objetivo: 'OBJ-C2: Aumentar la Retención y Fidelización', nombre: 'Tasa de Retención de Clientes', unidad: '%', meta: 90, real: 87, inverso: false, accion: 'Retención al 96.7% de meta. Lanzar programa de fidelización con descuentos por volumen.', orden: 4 },
  { id: 'C2.2', perspectivaId: 'clientes', objetivo: 'OBJ-C2: Aumentar la Retención y Fidelización', nombre: 'Tasa de Recompra (Repeat Purchase)', unidad: '%', meta: 55, real: 49, inverso: false, accion: 'Recompra al 89% de meta. Implementar campañas de re-engagement a los 90 días.', orden: 5 },
  { id: 'C2.3', perspectivaId: 'clientes', objetivo: 'OBJ-C2: Aumentar la Retención y Fidelización', nombre: 'Churn Rate (Tasa de Abandono)', unidad: '%', meta: 5, real: 7.2, inverso: true, accion: 'Churn 7.2% vs. 5% meta (KPI inverso — CRÍTICO). Crear equipo de Customer Success.', orden: 6 },
  { id: 'C3.1', perspectivaId: 'clientes', objetivo: 'OBJ-C3: Expandir la Base de Clientes', nombre: 'Nuevos Clientes Adquiridos', unidad: '#', meta: 120, real: 105, inverso: false, accion: '105 nuevos clientes vs. 120 meta (87.5%). Ampliar fuerza de ventas en regiones.', orden: 7 },
  { id: 'C3.2', perspectivaId: 'clientes', objetivo: 'OBJ-C3: Expandir la Base de Clientes', nombre: 'Cuota de Mercado', unidad: '%', meta: 8.5, real: 7.8, inverso: false, accion: 'Cuota al 91.8% de meta. Ejecutar campañas de awareness en mercados objetivo.', orden: 8 },
  { id: 'C3.3', perspectivaId: 'clientes', objetivo: 'OBJ-C3: Expandir la Base de Clientes', nombre: 'Costo por Lead Calificado', unidad: 'S/', meta: 180, real: 215, inverso: true, accion: 'CAC por lead elevado. Migrar mayor presupuesto a canales orgánicos (SEO/contenido).', orden: 9 },

  { id: 'P1.1', perspectivaId: 'procesos', objetivo: 'OBJ-P1: Excelencia en Operaciones y Calidad', nombre: 'Tiempo Promedio de Entrega al Cliente', unidad: 'días', meta: 3, real: 3.5, inverso: true, accion: 'Entrega en 3.5 días vs. 3 días meta. Revisar cuellos de botella en picking y despacho.', orden: 1 },
  { id: 'P1.2', perspectivaId: 'procesos', objetivo: 'OBJ-P1: Excelencia en Operaciones y Calidad', nombre: 'Tasa de Defectos / Reclamos', unidad: '%', meta: 2, real: 2.8, inverso: true, accion: 'Defectos al 2.8% vs. 2% meta. Implementar control de calidad en cada etapa del proceso.', orden: 2 },
  { id: 'P1.3', perspectivaId: 'procesos', objetivo: 'OBJ-P1: Excelencia en Operaciones y Calidad', nombre: 'Productividad por Empleado', unidad: 'S/ MM', meta: 0.25, real: 0.22, inverso: false, accion: 'Productividad por debajo de meta. Automatizar tareas repetitivas con RPA.', orden: 3 },
  { id: 'P2.1', perspectivaId: 'procesos', objetivo: 'OBJ-P2: Innovación y Desarrollo de Producto', nombre: 'N° Lanzamientos de Nuevos Productos', unidad: '#', meta: 4, real: 3, inverso: false, accion: 'Solo 3 de 4 productos lanzados. Acelerar MVP del 4° producto para Q4.', orden: 4 },
  { id: 'P2.2', perspectivaId: 'procesos', objetivo: 'OBJ-P2: Innovación y Desarrollo de Producto', nombre: 'Time-to-Market (lanzamiento)', unidad: 'semanas', meta: 12, real: 15, inverso: true, accion: 'Time-to-market 25% por encima de meta. Adoptar metodología ágil en equipos de producto.', orden: 5 },
  { id: 'P2.3', perspectivaId: 'procesos', objetivo: 'OBJ-P2: Innovación y Desarrollo de Producto', nombre: '% Ingresos de Productos < 2 años', unidad: '%', meta: 25, real: 18, inverso: false, accion: 'Ingresos de nuevos productos al 72% de meta. Fortalecer validación de mercado pre-lanzamiento.', orden: 6 },
  { id: 'P3.1', perspectivaId: 'procesos', objetivo: 'OBJ-P3: Gestión Eficiente de Proveedores', nombre: 'On-Time Delivery de Proveedores (OTD)', unidad: '%', meta: 95, real: 92, inverso: false, accion: 'OTD al 96.8% de meta. Negociar SLAs más estrictos con los 3 proveedores críticos.', orden: 7 },
  { id: 'P3.2', perspectivaId: 'procesos', objetivo: 'OBJ-P3: Gestión Eficiente de Proveedores', nombre: 'N° Incidencias con Proveedores', unidad: '#', meta: 5, real: 8, inverso: true, accion: '8 incidencias vs. 5 meta. Implementar sistema de evaluación mensual de proveedores.', orden: 8 },
  { id: 'P3.3', perspectivaId: 'procesos', objetivo: 'OBJ-P3: Gestión Eficiente de Proveedores', nombre: 'Costo de Inventario sobre Ventas', unidad: '%', meta: 12, real: 14.5, inverso: true, accion: 'Inventario al 20.8% sobre meta. Revisar política de stock mínimo y modelo de compras.', orden: 9 },

  { id: 'A1.1', perspectivaId: 'aprendizaje', objetivo: 'OBJ-A1: Desarrollar el Capital Humano', nombre: 'Horas de Capacitación por Empleado', unidad: 'hrs', meta: 40, real: 35, inverso: false, accion: '35 hrs vs. 40 hrs meta (87.5%). Agregar 2 sesiones de capacitación virtual mensual.', orden: 1 },
  { id: 'A1.2', perspectivaId: 'aprendizaje', objetivo: 'OBJ-A1: Desarrollar el Capital Humano', nombre: '% Empleados con Plan de Desarrollo', unidad: '%', meta: 80, real: 72, inverso: false, accion: '72% vs. 80% meta. Hacer obligatoria la capacitación para todos los equipos de ventas.', orden: 2 },
  { id: 'A1.3', perspectivaId: 'aprendizaje', objetivo: 'OBJ-A1: Desarrollar el Capital Humano', nombre: 'Índice de Competencias Clave Cubiertas', unidad: '%', meta: 85, real: 74, inverso: false, accion: '74% vs. 85% meta. Identificar brechas de competencias y crear plan de cierre por área.', orden: 3 },
  { id: 'A2.1', perspectivaId: 'aprendizaje', objetivo: 'OBJ-A2: Fortalecer la Cultura y el Clima', nombre: 'Índice de Satisfacción del Empleado', unidad: '%', meta: 75, real: 68, inverso: false, accion: 'Satisfacción al 90.7% de meta. Lanzar encuesta trimestral y plan de acción en 30 días.', orden: 4 },
  { id: 'A2.2', perspectivaId: 'aprendizaje', objetivo: 'OBJ-A2: Fortalecer la Cultura y el Clima', nombre: 'Rotación de Personal (Turnover)', unidad: '%', meta: 8, real: 10, inverso: true, accion: 'Rotación 10% vs. 8% meta (KPI inverso — CRÍTICO). Revisar esquema de compensación y línea de carrera.', orden: 5 },
  { id: 'A2.3', perspectivaId: 'aprendizaje', objetivo: 'OBJ-A2: Fortalecer la Cultura y el Clima', nombre: '% Empleados con Evaluación Desempeño', unidad: '%', meta: 95, real: 88, inverso: false, accion: '88% vs. 95% meta. Completar evaluaciones de desempeño pendientes antes de fin de Q3.', orden: 6 },
  { id: 'A3.1', perspectivaId: 'aprendizaje', objetivo: 'OBJ-A3: Impulsar la Innovación Organizacional', nombre: 'Proyectos de Mejora Continua Activos', unidad: '#', meta: 6, real: 5, inverso: false, accion: '5 de 6 proyectos activos (83.3%). Conformar equipo de mejora continua multidisciplinario.', orden: 7 },
  { id: 'A3.2', perspectivaId: 'aprendizaje', objetivo: 'OBJ-A3: Impulsar la Innovación Organizacional', nombre: '% Presupuesto I+D sobre Ingresos', unidad: '%', meta: 5, real: 3.8, inverso: false, accion: 'Presupuesto I+D al 76% de meta. Presentar propuesta de incremento para próximo presupuesto.', orden: 8 },
  { id: 'A3.3', perspectivaId: 'aprendizaje', objetivo: 'OBJ-A3: Impulsar la Innovación Organizacional', nombre: 'Ideas Implementadas de Empleados', unidad: '#', meta: 24, real: 16, inverso: false, accion: '16 de 24 ideas implementadas (66.7%). Crear plataforma digital de gestión de ideas.', orden: 9 },
]
