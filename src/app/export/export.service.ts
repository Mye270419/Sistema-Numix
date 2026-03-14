import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ── Tipos compartidos ──────────────────────────────────────
export interface EmpresaInfo {
  nombre: string;
  nit: string;
  direccion?: string;
}

// Colores corporativos NUMIX
const COLORS = {
  primary:    [30,  33,  48]  as [number, number, number],  // #1e2130
  accent:     [59,  91,  219] as [number, number, number],  // #3b5bdb
  header:     [37,  43,  59]  as [number, number, number],  // #252b3b
  text:       [200, 208, 224] as [number, number, number],  // #c8d0e0
  white:      [255, 255, 255] as [number, number, number],
  green:      [72,  187, 120] as [number, number, number],
  red:        [252, 129, 129] as [number, number, number],
  amber:      [246, 173, 85]  as [number, number, number],
};

@Injectable({ providedIn: 'root' })
export class ExportService {

  // ── HELPERS PDF ───────────────────────────────────────────

  private crearDocumento(orientacion: 'p' | 'l' = 'p'): jsPDF {
    return new jsPDF({ orientation: orientacion, unit: 'mm', format: 'a4' });
  }

  private agregarEncabezado(
    doc: jsPDF,
    titulo: string,
    subtitulo: string,
    empresa: EmpresaInfo,
    periodo?: string
  ): number {
    const pageW = doc.internal.pageSize.getWidth();

    // Fondo header
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageW, 40, 'F');

    // Franja accent
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 40, pageW, 2, 'F');

    // Nombre empresa
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(empresa.nombre.toUpperCase(), 14, 12);
    doc.text(`NIT: ${empresa.nit}`, 14, 18);
    if (empresa.direccion) doc.text(empresa.direccion, 14, 24);

    // Título centrado
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, pageW / 2, 16, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitulo, pageW / 2, 24, { align: 'center' });

    if (periodo) {
      doc.setFontSize(9);
      doc.text(periodo, pageW / 2, 31, { align: 'center' });
    }

    // Fecha de emisión (derecha)
    doc.setFontSize(8);
    const fecha = new Date().toLocaleDateString('es-BO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    doc.text(`Emitido: ${fecha}`, pageW - 14, 12, { align: 'right' });

    return 50; // y inicial para el contenido
  }

  private agregarPiePagina(doc: jsPDF): void {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...COLORS.header);
      doc.rect(0, pageH - 12, pageW, 12, 'F');
      doc.setTextColor(...COLORS.text);
      doc.setFontSize(7);
      doc.text('NUMIX — Sistema Contable Bolivia', 14, pageH - 5);
      doc.text(`Página ${i} de ${pageCount}`, pageW - 14, pageH - 5, { align: 'right' });
    }
  }

  private formatBs(valor: number): string {
    return `Bs ${valor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // ── 1. BALANCE GENERAL PDF ────────────────────────────────
  exportBalanceGeneralPDF(datos: {
    empresa: EmpresaInfo;
    fecha: string;
    activos: any[];
    pasivos: any[];
    patrimonio: any[];
    totalActivos: number;
    totalPasivos: number;
    totalPatrimonio: number;
  }): void {
    const doc = this.crearDocumento('p');
    let y = this.agregarEncabezado(
      doc, 'BALANCE GENERAL',
      `Al ${datos.fecha}`,
      datos.empresa
    );

    const pageW = doc.internal.pageSize.getWidth();
    const colW  = (pageW - 28) / 2;

    // Columna ACTIVOS
    doc.setFillColor(...COLORS.accent);
    doc.rect(14, y, colW, 8, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVOS', 14 + colW / 2, y + 5.5, { align: 'center' });

    // Columna PASIVOS
    const x2 = 14 + colW + 4;
    doc.setFillColor(...COLORS.accent);
    doc.rect(x2, y, colW, 8, 'F');
    doc.text('PASIVOS Y PATRIMONIO', x2 + colW / 2, y + 5.5, { align: 'center' });
    y += 12;

    const filaActivos  = datos.activos.map(a => [a.codigo, a.nombre, this.formatBs(a.saldo)]);
    const filaPasivos  = datos.pasivos.map(p => [p.codigo, p.nombre, this.formatBs(p.saldo)]);
    const filaPatrimonio = datos.patrimonio.map(p => [p.codigo, p.nombre, this.formatBs(p.saldo)]);

    // Tabla Activos
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 + colW + 4 },
      head: [['Cód.', 'Cuenta', 'Saldo']],
      body: filaActivos,
      foot: [['', 'TOTAL ACTIVOS', this.formatBs(datos.totalActivos)]],
      theme: 'grid',
      headStyles: { fillColor: COLORS.header, textColor: COLORS.white, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 15 }, 2: { halign: 'right' } },
    });

    // Tabla Pasivos + Patrimonio
    autoTable(doc, {
      startY: y, margin: { left: x2, right: 14 },
      head: [['Cód.', 'Cuenta', 'Saldo']],
      body: [...filaPasivos, ['', '', ''], ...filaPatrimonio],
      foot: [['', 'TOTAL PAS. + PAT.', this.formatBs(datos.totalPasivos + datos.totalPatrimonio)]],
      theme: 'grid',
      headStyles: { fillColor: COLORS.header, textColor: COLORS.white, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 15 }, 2: { halign: 'right' } },
    });

    this.agregarPiePagina(doc);
    doc.save(`Balance_General_${datos.fecha}.pdf`);
  }

  // ── 2. ESTADO DE RESULTADOS PDF ───────────────────────────
  exportEstadoResultadosPDF(datos: {
    empresa: EmpresaInfo;
    periodo: string;
    ingresos: any[];
    costos: any[];
    gastos: any[];
    totalIngresos: number;
    totalCostos: number;
    totalGastos: number;
    utilidadBruta: number;
    utilidadNeta: number;
  }): void {
    const doc = this.crearDocumento('p');
    let y = this.agregarEncabezado(
      doc, 'ESTADO DE RESULTADOS',
      datos.periodo, datos.empresa
    );

    const seccion = (titulo: string, filas: any[][], total: number, color: [number, number, number]) => {
      autoTable(doc, {
        startY: y,
        head: [[{ content: titulo, colSpan: 3, styles: { fillColor: color as [number, number, number], textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 } }],
               ['Cód.', 'Cuenta', 'Monto']],
        body: filas,
        foot: [['', `TOTAL ${titulo}`, this.formatBs(total)]],
        theme: 'striped',
        headStyles: { fillColor: COLORS.header, textColor: COLORS.white, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        footStyles: { fillColor: color as [number, number, number], textColor: COLORS.white, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 18 }, 2: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    };

    seccion('INGRESOS', datos.ingresos.map(i => [i.codigo, i.nombre, this.formatBs(i.saldo)]),
      datos.totalIngresos, COLORS.accent);

    seccion('COSTOS', datos.costos.map(c => [c.codigo, c.nombre, this.formatBs(c.saldo)]),
      datos.totalCostos, COLORS.header);

    // Utilidad bruta
    doc.setFillColor(...COLORS.green);
    doc.rect(14, y, doc.internal.pageSize.getWidth() - 28, 9, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('UTILIDAD BRUTA', 18, y + 6);
    doc.text(this.formatBs(datos.utilidadBruta), doc.internal.pageSize.getWidth() - 18, y + 6, { align: 'right' });
    y += 14;

    seccion('GASTOS', datos.gastos.map(g => [g.codigo, g.nombre, this.formatBs(g.saldo)]),
      datos.totalGastos, COLORS.red);

    // Utilidad neta
    const colorUtilidad = datos.utilidadNeta >= 0 ? COLORS.green : COLORS.red;
    doc.setFillColor(...colorUtilidad);
    doc.rect(14, y, doc.internal.pageSize.getWidth() - 28, 10, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(11);
    doc.text('UTILIDAD NETA DEL PERÍODO', 18, y + 7);
    doc.text(this.formatBs(datos.utilidadNeta), doc.internal.pageSize.getWidth() - 18, y + 7, { align: 'right' });

    this.agregarPiePagina(doc);
    doc.save(`Estado_Resultados_${new Date().getFullYear()}.pdf`);
  }

  // ── 3. BALANCE DE COMPROBACIÓN PDF ────────────────────────
  exportBalanceComprobacionPDF(datos: {
    empresa: EmpresaInfo;
    periodo: string;
    cuentas: {
      codigo: string; nombre: string;
      sumasDebe: number; sumasHaber: number;
      saldoDeudor: number; saldoAcreedor: number;
    }[];
  }): void {
    const doc = this.crearDocumento('l');
    let y = this.agregarEncabezado(
      doc, 'BALANCE DE COMPROBACIÓN (SUMAS Y SALDOS)',
      datos.periodo, datos.empresa
    );

    const totalSumasDebe   = datos.cuentas.reduce((s, c) => s + c.sumasDebe, 0);
    const totalSumasHaber  = datos.cuentas.reduce((s, c) => s + c.sumasHaber, 0);
    const totalSaldoDeudor = datos.cuentas.reduce((s, c) => s + c.saldoDeudor, 0);
    const totalSaldoAcreedor = datos.cuentas.reduce((s, c) => s + c.saldoAcreedor, 0);

    autoTable(doc, {
      startY: y,
      head: [
        [
          { content: 'CUENTA', rowSpan: 2 },
          { content: 'NOMBRE', rowSpan: 2 },
          { content: 'SUMAS', colSpan: 2, styles: { halign: 'center' } },
          { content: 'SALDOS', colSpan: 2, styles: { halign: 'center' } },
        ],
        ['DEBE', 'HABER', 'DEUDOR', 'ACREEDOR']
      ],
      body: datos.cuentas.map(c => [
        c.codigo, c.nombre,
        this.formatBs(c.sumasDebe), this.formatBs(c.sumasHaber),
        c.saldoDeudor   > 0 ? this.formatBs(c.saldoDeudor)   : '',
        c.saldoAcreedor > 0 ? this.formatBs(c.saldoAcreedor) : '',
      ]),
      foot: [[
        '', 'TOTALES',
        this.formatBs(totalSumasDebe), this.formatBs(totalSumasHaber),
        this.formatBs(totalSaldoDeudor), this.formatBs(totalSaldoAcreedor),
      ]],
      theme: 'grid',
      headStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 7.5 },
      footStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        2: { halign: 'right' }, 3: { halign: 'right' },
        4: { halign: 'right' }, 5: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    this.agregarPiePagina(doc);
    doc.save(`Balance_Comprobacion_${datos.periodo}.pdf`);
  }

  // ── 4. LIBRO DIARIO PDF ───────────────────────────────────
  exportLibroDiarioPDF(datos: {
    empresa: EmpresaInfo;
    periodo: string;
    asientos: {
      numero: string; fecha: string; descripcion: string;
      detalles: { cuenta: string; nombre: string; debe: number; haber: number }[];
    }[];
  }): void {
    const doc = this.crearDocumento('p');
    let y = this.agregarEncabezado(doc, 'LIBRO DIARIO', datos.periodo, datos.empresa);

    for (const asiento of datos.asientos) {
      const filas = asiento.detalles.map(d => [
        d.cuenta, d.nombre,
        d.debe  > 0 ? this.formatBs(d.debe)  : '',
        d.haber > 0 ? this.formatBs(d.haber) : '',
      ]);
      const totalDebe  = asiento.detalles.reduce((s, d) => s + d.debe, 0);
      const totalHaber = asiento.detalles.reduce((s, d) => s + d.haber, 0);

      autoTable(doc, {
        startY: y,
        head: [[
          { content: `Asiento #${asiento.numero} — ${asiento.fecha} — ${asiento.descripcion}`,
            colSpan: 4, styles: { fillColor: COLORS.header, textColor: COLORS.white, fontSize: 8 } },
        ], ['Código', 'Cuenta', 'DEBE', 'HABER']],
        body: filas,
        foot: [['', 'TOTALES', this.formatBs(totalDebe), this.formatBs(totalHaber)]],
        theme: 'grid',
        headStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        footStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 22 }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 6;
      if (y > 250) { doc.addPage(); y = 20; }
    }

    this.agregarPiePagina(doc);
    doc.save(`Libro_Diario_${datos.periodo}.pdf`);
  }

  // ── 5. PLANILLA NÓMINAS PDF ───────────────────────────────
  exportPlanillaPDF(datos: {
    empresa: EmpresaInfo;
    mes: string; anio: number;
    empleados: {
      nombre: string; ci: string; cargo: string;
      totalGanado: number; totalDescuentos: number;
      liquidoPagable: number; totalPatronal: number;
    }[];
    totales: { ganado: number; descuentos: number; liquido: number; patronal: number };
  }): void {
    const doc = this.crearDocumento('l');
    let y = this.agregarEncabezado(
      doc, 'PLANILLA DE SUELDOS Y SALARIOS',
      `${datos.mes} ${datos.anio}`, datos.empresa
    );

    autoTable(doc, {
      startY: y,
      head: [['CI', 'Nombre Completo', 'Cargo', 'Total Ganado', 'Descuentos', 'Líquido Pagable', 'Ap. Patronal']],
      body: datos.empleados.map(e => [
        e.ci, e.nombre, e.cargo,
        this.formatBs(e.totalGanado),
        this.formatBs(e.totalDescuentos),
        this.formatBs(e.liquidoPagable),
        this.formatBs(e.totalPatronal),
      ]),
      foot: [['', '', 'TOTALES',
        this.formatBs(datos.totales.ganado),
        this.formatBs(datos.totales.descuentos),
        this.formatBs(datos.totales.liquido),
        this.formatBs(datos.totales.patronal),
      ]],
      theme: 'striped',
      headStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontSize: 9 },
      bodyStyles: { fontSize: 8.5 },
      footStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        3: { halign: 'right' }, 4: { halign: 'right', textColor: [220, 80, 80] },
        5: { halign: 'right', textColor: [50, 180, 100] }, 6: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    this.agregarPiePagina(doc);
    doc.save(`Planilla_${datos.mes}_${datos.anio}.pdf`);
  }

  // ── 6. KARDEX PDF ─────────────────────────────────────────
  exportKardexPDF(datos: {
    empresa: EmpresaInfo;
    producto: { codigo: string; nombre: string; unidad: string };
    periodo: string;
    movimientos: {
      fecha: string; tipo: string; cantidad: number;
      costoUnitario: number; costoTotal: number;
      stockAnterior: number; stockPosterior: number; glosa: string;
    }[];
  }): void {
    const doc = this.crearDocumento('l');
    let y = this.agregarEncabezado(
      doc, 'KARDEX DE VALORACIÓN',
      `${datos.producto.codigo} — ${datos.producto.nombre} | ${datos.periodo}`,
      datos.empresa
    );

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Movimiento', 'Glosa', 'Cant.', 'Costo Unit.', 'Costo Total', 'Stock Ant.', 'Stock Post.']],
      body: datos.movimientos.map(m => [
        m.fecha, m.tipo, m.glosa,
        m.cantidad, this.formatBs(m.costoUnitario),
        this.formatBs(m.costoTotal), m.stockAnterior, m.stockPosterior,
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        4: { halign: 'right' }, 5: { halign: 'right' },
        6: { halign: 'right' }, 7: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    this.agregarPiePagina(doc);
    doc.save(`Kardex_${datos.producto.codigo}_${datos.periodo}.pdf`);
  }

  // ════════════════════════════════════════════════════════
  // EXPORTACIONES EXCEL
  // ════════════════════════════════════════════════════════

  private crearExcel(nombreHoja: string, cabeceras: string[], filas: any[][], nombreArchivo: string, totales?: any[]): void {
    const wb = XLSX.utils.book_new();
    const wsData = [cabeceras, ...filas];
    if (totales) wsData.push(totales);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Ancho de columnas automático
    ws['!cols'] = cabeceras.map((_, i) => ({
      wch: Math.max(15, ...filas.map(f => String(f[i] || '').length))
    }));

    XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${nombreArchivo}.xlsx`);
  }

  exportBalanceGeneralExcel(datos: any): void {
    const filas = [
      ['ACTIVOS', '', ''], ...datos.activos.map((a: any) => [a.codigo, a.nombre, a.saldo]),
      ['', 'TOTAL ACTIVOS', datos.totalActivos], ['', '', ''],
      ['PASIVOS', '', ''], ...datos.pasivos.map((p: any) => [p.codigo, p.nombre, p.saldo]),
      ['', 'TOTAL PASIVOS', datos.totalPasivos], ['', '', ''],
      ['PATRIMONIO', '', ''], ...datos.patrimonio.map((p: any) => [p.codigo, p.nombre, p.saldo]),
      ['', 'TOTAL PATRIMONIO', datos.totalPatrimonio], ['', '', ''],
      ['', 'TOTAL PASIVOS + PATRIMONIO', datos.totalPasivos + datos.totalPatrimonio],
    ];
    this.crearExcel('Balance General', ['Código', 'Cuenta', 'Saldo (Bs)'], filas, `Balance_General_${datos.fecha}`);
  }

  exportEstadoResultadosExcel(datos: any): void {
    const filas = [
      ['INGRESOS', '', ''], ...datos.ingresos.map((i: any) => [i.codigo, i.nombre, i.saldo]),
      ['', 'TOTAL INGRESOS', datos.totalIngresos], ['', '', ''],
      ['COSTOS', '', ''], ...datos.costos.map((c: any) => [c.codigo, c.nombre, c.saldo]),
      ['', 'TOTAL COSTOS', datos.totalCostos], ['', '', ''],
      ['', 'UTILIDAD BRUTA', datos.utilidadBruta], ['', '', ''],
      ['GASTOS', '', ''], ...datos.gastos.map((g: any) => [g.codigo, g.nombre, g.saldo]),
      ['', 'TOTAL GASTOS', datos.totalGastos], ['', '', ''],
      ['', 'UTILIDAD NETA', datos.utilidadNeta],
    ];
    this.crearExcel('Estado de Resultados', ['Código', 'Cuenta', 'Monto (Bs)'], filas, `Estado_Resultados_${new Date().getFullYear()}`);
  }

  exportBalanceComprobacionExcel(datos: any): void {
    this.crearExcel(
      'Balance Comprobación',
      ['Código', 'Nombre', 'Sumas Debe', 'Sumas Haber', 'Saldo Deudor', 'Saldo Acreedor'],
      datos.cuentas.map((c: any) => [c.codigo, c.nombre, c.sumasDebe, c.sumasHaber, c.saldoDeudor, c.saldoAcreedor]),
      `Balance_Comprobacion_${datos.periodo}`
    );
  }

  exportLibroDiarioExcel(datos: any): void {
    const filas: any[] = [];
    for (const a of datos.asientos) {
      filas.push([`Asiento #${a.numero}`, a.fecha, a.descripcion, '', '']);
      for (const d of a.detalles) {
        filas.push(['', d.cuenta, d.nombre, d.debe || '', d.haber || '']);
      }
      filas.push(['', '', '', '', '']);
    }
    this.crearExcel('Libro Diario', ['Asiento', 'Fecha/Código', 'Descripción/Cuenta', 'Debe', 'Haber'], filas, `Libro_Diario_${datos.periodo}`);
  }

  exportPlanillaExcel(datos: any): void {
    this.crearExcel(
      `Planilla ${datos.mes} ${datos.anio}`,
      ['CI', 'Nombre', 'Cargo', 'Total Ganado', 'AFP Lab.', 'Caja Lab.', 'RC-IVA', 'Total Desc.', 'Líquido', 'Ap. Patronal'],
      datos.empleados.map((e: any) => [
        e.ci, e.nombre, e.cargo,
        e.totalGanado, e.afpLaboral, e.cajaLaboral, e.rcIva,
        e.totalDescuentos, e.liquidoPagable, e.totalPatronal,
      ]),
      `Planilla_${datos.mes}_${datos.anio}`,
      ['', '', 'TOTALES', datos.totales.ganado, '', '', '', datos.totales.descuentos, datos.totales.liquido, datos.totales.patronal]
    );
  }

  exportKardexExcel(datos: any): void {
    this.crearExcel(
      `Kardex ${datos.producto.codigo}`,
      ['Fecha', 'Movimiento', 'Glosa', 'Cantidad', 'Costo Unit.', 'Costo Total', 'Stock Anterior', 'Stock Posterior'],
      datos.movimientos.map((m: any) => [
        m.fecha, m.tipo, m.glosa, m.cantidad,
        m.costoUnitario, m.costoTotal, m.stockAnterior, m.stockPosterior,
      ]),
      `Kardex_${datos.producto.codigo}_${datos.periodo}`
    );
  }
}