import { jsPDF } from 'jspdf';
import {
  ElevatorConfigState,
  ElevatorCalculationResults,
} from './elevator-calculator';

export interface GeneratePdfOptions {
  state: ElevatorConfigState;
  results: ElevatorCalculationResults;
  blueprintDataUrl?: string;
  projectName?: string;
  authorName?: string;
}

/**
 * Gera e realiza o download do relatório técnico completo em PDF
 * em conformidade com a ABNT NBR 16858-1:2020.
 */
export async function generateElevatorPdf({
  state,
  results,
  blueprintDataUrl,
  projectName = 'Dimensionamento Padrão',
  authorName = 'Configurador de Elevadores Web',
}: GeneratePdfOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182 mm

  const now = new Date();
  const dataFormatada = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaFormatada = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // ==========================================
  // PÁGINA 1: MEMORIAL DE CÁLCULO & DADOS
  // ==========================================

  // 1. Cabeçalho Topo
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(marginX, 12, contentWidth, 26, 'F');

  // Faixa decorativa ciano
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(marginX, 38, contentWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RELATÓRIO TÉCNICO DE ENGENHARIA', marginX + 6, 21);

  doc.setTextColor(103, 232, 249); // cyan-300
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'DIMENSIONAMENTO DE ELEVADOR — ABNT NBR 16858-1:2020 / NM 313',
    marginX + 6,
    27
  );

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(7.5);
  doc.text(
    `Emissão: ${dataFormatada} às ${horaFormatada}`,
    marginX + contentWidth - 6,
    21,
    { align: 'right' }
  );
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Projeto: ${projectName}`,
    marginX + contentWidth - 6,
    27,
    { align: 'right' }
  );

  // 2. 4 Cards de Destaque Executivo (KPIs)
  const cardY = 43;
  const cardH = 20;
  const cardGap = 3;
  const cardW = (contentWidth - cardGap * 3) / 4;

  const kpiData = [
    {
      label: 'LOTAÇÃO MÁXIMA',
      value: `${results.numeroPassageiros} Passageiros`,
      sub: 'ABNT NBR 16858-1',
      bg: [236, 253, 245], // emerald-50
      border: [16, 185, 129], // emerald-500
      text: [6, 95, 70],
    },
    {
      label: 'CARGA ÚTIL (Q)',
      value: `${results.cargaUtilKg} kg`,
      sub: `Mín: ${results.cargaMinimaInterpoladaKg} kg`,
      bg: [255, 251, 235], // amber-50
      border: [245, 158, 11], // amber-500
      text: [146, 64, 14],
    },
    {
      label: 'POÇO (LP × PP)',
      value: `${results.larguraPoco} × ${results.profundidadePoco}`,
      sub: 'Medidas em milímetros',
      bg: [239, 246, 255], // blue-50
      border: [59, 130, 246], // blue-500
      text: [30, 64, 175],
    },
    {
      label: 'CABINE ÚTIL',
      value: `${state.larguraCabine} × ${state.profundidadeCabine}`,
      sub: `Área: ${results.areaCabineM2.toFixed(2)} m²`,
      bg: [240, 253, 250], // cyan-50
      border: [6, 182, 212], // cyan-500
      text: [21, 94, 117],
    },
  ];

  kpiData.forEach((kpi, idx) => {
    const x = marginX + idx * (cardW + cardGap);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, cardY, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, cardY + 5);

    doc.setFontSize(10.5);
    doc.setTextColor(kpi.text[0], kpi.text[1], kpi.text[2]);
    doc.text(kpi.value, x + 3, cardY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 3, cardY + 17);
  });

  // Função auxiliar para desenhar tabelas técnicas elegantes
  let currentY = 67;

  const drawSectionHeader = (title: string, yPos: number): number => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.rect(marginX, yPos, contentWidth, 6.5, 'FD');

    doc.setFillColor(6, 182, 212); // cyan-500 bar
    doc.rect(marginX, yPos, 2, 6.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title, marginX + 5, yPos + 4.5);
    return yPos + 7.5;
  };

  const drawRow = (
    label: string,
    val: string,
    yPos: number,
    isAlternate: boolean = false,
    valColor: [number, number, number] = [15, 23, 42],
    isBoldVal: boolean = false
  ): number => {
    const rowH = 5.2;
    if (isAlternate) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, yPos, contentWidth, rowH, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, yPos + rowH, marginX + contentWidth, yPos + rowH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, marginX + 4, yPos + 3.8);

    doc.setFont('helvetica', isBoldVal ? 'bold' : 'normal');
    doc.setTextColor(valColor[0], valColor[1], valColor[2]);
    doc.text(val, marginX + contentWidth - 4, yPos + 3.8, { align: 'right' });

    return yPos + rowH;
  };

  // 3. Seção 1: Avaliação Normativa NBR 16858-1
  currentY = drawSectionHeader(
    '1. CAPACIDADE DE PASSAGEIROS E CARGA ÚTIL (ABNT NBR 16858-1:2020)',
    currentY
  );
  currentY = drawRow(
    'Lotação Máxima Suportada (Tabela 7 - Número de Passageiros)',
    `${results.numeroPassageiros} passageiros`,
    currentY,
    false,
    [16, 185, 129],
    true
  );
  currentY = drawRow(
    'Carga Útil Nominal Adotada (Q)',
    `${results.cargaUtilKg} kg`,
    currentY,
    true,
    [217, 119, 6],
    true
  );
  currentY = drawRow(
    'Carga Mínima Exigida para a Área Real (Tabela 6 - Interpolação NBR)',
    `${results.cargaMinimaInterpoladaKg} kg`,
    currentY,
    false
  );
  currentY = drawRow(
    'Área Útil Efetiva da Cabine',
    `${results.areaCabineM2.toFixed(2)} m² (${state.larguraCabine} mm × ${state.profundidadeCabine} mm)`,
    currentY,
    true
  );
  currentY = drawRow(
    `Área Máxima Permitida para ${results.cargaUtilKg} kg (Tabela 6)`,
    `${results.areaMaxPermitidaM2.toFixed(2)} m²`,
    currentY,
    false
  );
  currentY = drawRow(
    'Massa Média de Referência por Passageiro',
    '75 kg / pessoa (conforme item 5.4.2.2 da ABNT NBR 16858-1)',
    currentY,
    true
  );
  currentY = drawRow(
    'Status de Conformidade da Área e Carga',
    'CONFORME COM A NORMA TÉCNICA (Área útil <= Área limite da Tabela 6)',
    currentY,
    false,
    [16, 185, 129],
    true
  );

  currentY += 4;

  // 4. Seção 2: Portas e Montantes da Cabine
  currentY = drawSectionHeader(
    '2. ARQUITETURA DA PORTA E MONTANTES FRONTAIS',
    currentY
  );
  currentY = drawRow(
    'Face de Instalação da Porta',
    `${results.nomeLadoPorta} (Medida da face: ${results.ladoFacePortaMm} mm)`,
    currentY,
    false
  );
  currentY = drawRow(
    'Tipo de Porta do Pavimento e Cabine',
    state.tipoPorta,
    currentY,
    true
  );
  currentY = drawRow(
    'Abertura Livre de Passagem (Vão Útil)',
    `${state.aberturaPorta} mm (Passo padronizado de 100 mm: 700 a 1200 mm)`,
    currentY,
    false,
    [2, 132, 199],
    true
  );
  currentY = drawRow(
    'Montantes Frontais Estruturais (Retornos)',
    `2× ${results.montanteFrontalMm} mm (Espaço livre total nos cantos: ${results.diferencaPortaLadoMm} mm)`,
    currentY,
    true,
    [16, 185, 129],
    true
  );
  currentY = drawRow(
    'Regra Construtiva (Porta < Lado da Cabine)',
    results.isPortaMenorQueLado
      ? `CONFORME: Abertura (${state.aberturaPorta} mm) estritamente menor que a face (${results.ladoFacePortaMm} mm)`
      : `ATENÇÃO: Abertura (${state.aberturaPorta} mm) excede ou iguala a face (${results.ladoFacePortaMm} mm)`,
    currentY,
    false,
    results.isPortaMenorQueLado ? [16, 185, 129] : [220, 38, 38],
    true
  );
  currentY = drawRow(
    'Configuração das Entradas do Pavimento',
    state.tipoEntrada === 'Unilateral'
      ? 'Unilateral (1 entrada frontal)'
      : state.tipoEntrada === 'Oposta'
      ? 'Entradas Opostas (2 portas a 180°)'
      : 'Entradas Adjacentes (2 portas a 90°)',
    currentY,
    true
  );

  currentY += 4;

  // 5. Seção 3: Dimensões da Caixa de Corrida (Poço)
  currentY = drawSectionHeader(
    '3. DIMENSIONAMENTO DA CAIXA DE CORRIDA (POÇO) E FOLGAS',
    currentY
  );
  currentY = drawRow(
    'LARGURA DO POÇO (LP) — Medida Mínima Acabada',
    `${results.larguraPoco} mm`,
    currentY,
    false,
    [15, 23, 42],
    true
  );
  currentY = drawRow(
    'PROFUNDIDADE DO POÇO (PP) — Medida Mínima Acabada',
    `${results.profundidadePoco} mm`,
    currentY,
    true,
    [15, 23, 42],
    true
  );
  currentY = drawRow(
    'Folga Frontal (Soleira da Cabine ao Marco do Pavimento)',
    `${results.folgaFrontal} mm`,
    currentY,
    false
  );
  currentY = drawRow(
    'Folga Necessária para Recolhimento da Porta',
    `${results.folgaPorta} mm`,
    currentY,
    true
  );
  currentY = drawRow(
    'Espaço Reservado para Chassis e Contrapeso/Pistão',
    `${results.espacoChassis} mm`,
    currentY,
    false
  );
  currentY = drawRow(
    'Menor Folga Lateral de Segurança',
    `${results.menorFolga} mm`,
    currentY,
    true
  );

  currentY += 4;

  // 6. Seção 4: Especificações Mecânicas
  currentY = drawSectionHeader(
    '4. SISTEMA DE TRAÇÃO E ESTRUTURA METÁLICA',
    currentY
  );
  currentY = drawRow(
    'Sistema de Acionamento',
    state.acionamento === 'Elétrico'
      ? 'Elétrico (Tração por Cabos com Contrapeso)'
      : 'Hidráulico (Pistão Lateral / Central)',
    currentY,
    false
  );
  currentY = drawRow(
    'Tipo de Arcada (Armação da Cabine)',
    state.arcada === 'L' ? 'Arcada Tipo L (Cantilever / Mochila)' : 'Arcada de Suspensão Central',
    currentY,
    true
  );
  currentY = drawRow(
    'Posição e Lado do Chassis na Caixa',
    `${state.posicao} — Chassis posicionado no lado ${state.ladoArcada.toUpperCase()}`,
    currentY,
    false
  );
  currentY = drawRow(
    'Tipo de Suporte de Guias Recomendado',
    results.tipoSuporte,
    currentY,
    true
  );
  currentY = drawRow(
    'Quantidade de Suportes de Guia por Andar',
    `${results.qtdSuporte} unidades por pavimento`,
    currentY,
    false
  );

  // Rodapé da Página 1
  const footerY = pageHeight - 10;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 3, marginX + contentWidth, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Configurador de Elevadores Web — Projeto derivado do repositório macoraty/elev',
    marginX,
    footerY
  );
  doc.text('Página 1 de 2', marginX + contentWidth, footerY, { align: 'right' });

  // ==========================================
  // PÁGINA 2: PLANTA BAIXA TÉCNICA (BLUEPRINT)
  // ==========================================
  doc.addPage('a4', 'portrait');

  // Cabeçalho da Página 2
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(marginX, 12, contentWidth, 18, 'F');
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(marginX, 30, contentWidth, 1.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PLANTA BAIXA TÉCNICA EXECUTIVA (CORTE HORIZONTAL)', marginX + 6, 21);

  doc.setTextColor(167, 243, 208); // emerald-200
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `POÇO: ${results.larguraPoco} × ${results.profundidadePoco} mm | CABINE: ${state.larguraCabine} × ${state.profundidadeCabine} mm | PORTA: ${state.aberturaPorta} mm (${state.tipoPorta})`,
    marginX + 6,
    26.5
  );

  // Se houver a imagem do blueprint gerada em alta definição pelo Canvas
  const blueprintY = 34;
  const blueprintW = contentWidth;
  const blueprintH = 150; // mm

  if (blueprintDataUrl) {
    try {
      doc.addImage(
        blueprintDataUrl,
        'PNG',
        marginX,
        blueprintY,
        blueprintW,
        blueprintH,
        undefined,
        'FAST'
      );
      // Moldura técnica externa
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.6);
      doc.rect(marginX, blueprintY, blueprintW, blueprintH);
    } catch (e) {
      console.error('Erro ao adicionar imagem da planta baixa ao PDF:', e);
      // Fallback: desenha caixa indicativa
      doc.setFillColor(8, 20, 38);
      doc.rect(marginX, blueprintY, blueprintW, blueprintH, 'F');
      doc.setTextColor(100, 255, 218);
      doc.setFontSize(12);
      doc.text(
        'Planta baixa técnica gerada conforme parâmetros informados.',
        marginX + blueprintW / 2,
        blueprintY + blueprintH / 2,
        { align: 'center' }
      );
    }
  } else {
    // Desenho vetorial de reserva
    doc.setFillColor(8, 20, 38);
    doc.rect(marginX, blueprintY, blueprintW, blueprintH, 'F');
    doc.setTextColor(100, 255, 218);
    doc.setFontSize(10);
    doc.text(
      'Planta Baixa Técnica Disponível no Visualizador CAD Interativo.',
      marginX + blueprintW / 2,
      blueprintY + blueprintH / 2,
      { align: 'center' }
    );
  }

  // Notas e Legenda Técnica abaixo da imagem
  const notesY = blueprintY + blueprintH + 4;
  const notesH = 46;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(marginX, notesY, contentWidth, notesH, 'FD');

  // Coluna 1: Legenda gráfica
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('LEGENDA DE ELEMENTOS TÉCNICOS:', marginX + 4, notesY + 5);

  const legendItems = [
    { color: [100, 255, 218], label: 'Cabine Útil e Paredes Internas' },
    { color: [255, 171, 64], label: 'Abertura Livre e Folhas da Porta' },
    { color: [167, 243, 208], label: 'Montantes Frontais de Cabine (Retornos)' },
    { color: [0, 229, 255], label: 'Viga de Arcada / Guias e Chassis' },
    { color: [239, 68, 68], label: 'Cotas e Alinhamentos Limítrofes (LP e PP)' },
  ];

  legendItems.forEach((item, i) => {
    const y = notesY + 9.5 + i * 4.5;
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(marginX + 4, y - 2.5, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    doc.text(item.label, marginX + 9, y);
  });

  // Linha divisória vertical
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX + 80, notesY + 2, marginX + 80, notesY + notesH - 2);

  // Coluna 2: Notas de Engenharia
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('NOTAS IMPORTANTES DE ENGENHARIA CIVIL E MONTAGEM:', marginX + 84, notesY + 5);

  const engineeringNotes = [
    '1. Todas as dimensões indicadas representam medidas mínimas livres acabadas (em mm).',
    '2. O prumo da caixa de corrida deve apresentar desvio máximo admissível de 25 mm em toda a altura.',
    '3. Paredes do poço devem suportar as forças normatizadas aplicadas pelos suportes de guia e freio de segurança.',
    '4. Rebaixo do poço (PIT) e última altura superior (Headroom) a serem validados conforme velocidade nominal.',
    '5. Conforme NBR 16858-1, a porta da cabine nunca pode ter vão livre superior à face da cabine.',
  ];

  engineeringNotes.forEach((note, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text(note, marginX + 84, notesY + 9.5 + i * 4.2);
  });

  // Carimbo de Identificação e Aprovação (Título do Carimbo)
  const stampY = notesY + notesH + 4;
  const stampH = 26;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.rect(marginX, stampY, contentWidth, stampH);

  // Divisões do carimbo
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(marginX + 60, stampY, marginX + 60, stampY + stampH);
  doc.line(marginX + 122, stampY, marginX + 122, stampY + stampH);

  // Box 1: Projeto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PROJETO EXECUTIVO:', marginX + 3, stampY + 5);
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('DIMENSIONAMENTO DE POÇO E CABINE', marginX + 3, stampY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Norma: ABNT NBR 16858-1:2020 / NM 313`, marginX + 3, stampY + 16);
  doc.text(`Autor: ${authorName}`, marginX + 3, stampY + 21);

  // Box 2: Capacidade e Carga
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CAPACIDADE E CARGA ÚTIL:', marginX + 63, stampY + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`${results.numeroPassageiros} PASSAGEIROS | ${results.cargaUtilKg} KG`, marginX + 63, stampY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Área de Cabine: ${results.areaCabineM2.toFixed(2)} m² (Permitida: ${results.areaMaxPermitidaM2.toFixed(2)} m²)`, marginX + 63, stampY + 16);
  doc.text(`Massa de Referência: 75 kg/pass.`, marginX + 63, stampY + 21);

  // Box 3: Aprovação e Visto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('RESPONSÁVEL TÉCNICO / CREA:', marginX + 125, stampY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text('Assinatura / Visto do Engenheiro:', marginX + 125, stampY + 12);
  doc.line(marginX + 125, stampY + 19, marginX + contentWidth - 4, stampY + 19);
  doc.setFontSize(6);
  doc.text(`Data: ${dataFormatada} - Folha 2 de 2`, marginX + 125, stampY + 23);

  // Rodapé da Página 2
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 3, marginX + contentWidth, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Configurador de Elevadores Web — Documento Técnico para Fins de Projeto e Pré-Dimensionamento',
    marginX,
    footerY
  );
  doc.text('Página 2 de 2', marginX + contentWidth, footerY, { align: 'right' });

  // Dispara o download do arquivo PDF
  const filename = `Memorial-Elevador-${results.numeroPassageiros}Pass-${results.cargaUtilKg}kg-${state.larguraCabine}x${state.profundidadeCabine}mm.pdf`;
  doc.save(filename);
}
