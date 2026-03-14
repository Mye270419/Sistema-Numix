import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService, Producto, MovimientoKardex } from './inventario.service';
import { ExportService } from '../export/export.service';
import { AuthService } from '../auth';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.css']
})
export class InventarioComponent implements OnInit {

  tabActivo: 'productos' | 'kardex' | 'nuevo-producto' | 'movimiento' = 'productos';
  productos: Producto[] = [];
  kardex: any[] = [];
  productoSeleccionado: Producto | null = null;
  productosBajoStock: Producto[] = [];
  guardando = false;
  busqueda = '';

  empresaId = localStorage.getItem('empresa_id') || '';

  productoForm: Partial<Producto> = this.formVacio();

  movimientoForm: Partial<MovimientoKardex> & { producto_id: string } = {
    producto_id: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_movimiento: 'entrada_compra',
    cantidad: 0, costo_unitario: 0, glosa: '',
  };

  tiposMovimiento = [
    { value: 'entrada_compra',    label: 'Entrada por Compra'  },
    { value: 'salida_venta',      label: 'Salida por Venta'    },
    { value: 'ajuste_entrada',    label: 'Ajuste Entrada'      },
    { value: 'ajuste_salida',     label: 'Ajuste Salida'       },
    { value: 'devolucion_compra', label: 'Devolucion Compra'   },
    { value: 'devolucion_venta',  label: 'Devolucion Venta'    },
  ];

  private get empresaInfo() {
    return { nombre: this.authService.currentUserValue?.empresa || 'NUMIX', nit: '123456789' };
  }

  get productosFiltrados() {
    const q = this.busqueda.toLowerCase();
    return this.productos.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));
  }

  get totalProductos()  { return this.productos.length; }
  get totalBajoStock()  { return this.productosBajoStock.length; }
  get valorTotalStock() { return this.productos.reduce((s, p) => s + (p.stock_actual * (p.precio_compra || 0)), 0); }

  constructor(
    private inventarioService: InventarioService,
    private exportService: ExportService,
    private authService: AuthService,
  ) {}

  ngOnInit() { this.cargarDatos(); }

  async cargarDatos() {
    try {
      this.productos = await this.inventarioService.getProductos(this.empresaId);
      this.productosBajoStock = await this.inventarioService.getProductosBajoStock(this.empresaId);
    } catch (err) { console.error(err); }
  }

  async verKardex(producto: Producto) {
    this.productoSeleccionado = producto;
    this.kardex = await this.inventarioService.getKardex(producto.id!);
    this.tabActivo = 'kardex';
  }

  formVacio(): Partial<Producto> {
    return { codigo: '', nombre: '', descripcion: '', tipo: 'bien', unidad_medida: 'UND', precio_venta: 0, precio_compra: 0, controla_stock: true, stock_actual: 0, stock_minimo: 0, activo: true };
  }

  async guardarProducto() {
    this.guardando = true;
    try {
      await this.inventarioService.createProducto({ ...this.productoForm as Producto, empresa_id: this.empresaId });
      this.productoForm = this.formVacio();
      this.tabActivo = 'productos';
      await this.cargarDatos();
      alert('Producto registrado correctamente');
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { this.guardando = false; }
  }

  async registrarMovimiento() {
    this.guardando = true;
    try {
      await this.inventarioService.registrarMovimiento({ ...this.movimientoForm as MovimientoKardex, empresa_id: this.empresaId });
      this.movimientoForm = { producto_id: '', fecha: new Date().toISOString().split('T')[0], tipo_movimiento: 'entrada_compra', cantidad: 0, costo_unitario: 0, glosa: '' };
      await this.cargarDatos();
      this.tabActivo = 'productos';
      alert('Movimiento registrado');
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { this.guardando = false; }
  }

  getTipoLabel(tipo: string): string { return this.tiposMovimiento.find(t => t.value === tipo)?.label || tipo; }
  esEntrada(tipo: string): boolean   { return ['entrada_compra','ajuste_entrada','devolucion_venta'].includes(tipo); }

  getStockClass(producto: Producto): string {
    if (!producto.controla_stock) return '';
    if (producto.stock_actual <= 0) return 'stock-agotado';
    if (producto.stock_actual <= producto.stock_minimo) return 'stock-bajo';
    return 'stock-ok';
  }

  // ── EXPORTACIONES ──────────────────────────────────────────
  private kardexPayload() {
    return {
      empresa:  this.empresaInfo,
      producto: { codigo: this.productoSeleccionado!.codigo, nombre: this.productoSeleccionado!.nombre, unidad: this.productoSeleccionado!.unidad_medida },
      periodo:  new Date().getFullYear().toString(),
      movimientos: this.kardex.map(k => ({
        fecha: k.fecha, tipo: this.getTipoLabel(k.tipo_movimiento),
        glosa: k.glosa || '', cantidad: k.cantidad,
        costoUnitario: k.costo_unitario, costoTotal: k.costo_total,
        stockAnterior: k.stock_anterior, stockPosterior: k.stock_posterior,
      })),
    };
  }

  exportarKardexPDF(): void {
    if (!this.productoSeleccionado || this.kardex.length === 0) {
      alert('Selecciona un producto con movimientos para exportar el Kardex.');
      return;
    }
    this.exportService.exportKardexPDF(this.kardexPayload());
  }

  exportarKardexExcel(): void {
    if (!this.productoSeleccionado || this.kardex.length === 0) {
      alert('Selecciona un producto con movimientos para exportar el Kardex.');
      return;
    }
    this.exportService.exportKardexExcel(this.kardexPayload());
  }

  exportarProductosExcel(): void {
    if (this.productos.length === 0) { alert('No hay productos para exportar.'); return; }
    import('xlsx').then(XLSX => {
      import('file-saver').then(({ saveAs }) => {
        const ws = XLSX.utils.json_to_sheet(this.productos.map(p => ({
          'Codigo': p.codigo, 'Nombre': p.nombre, 'Tipo': p.tipo,
          'Unidad': p.unidad_medida, 'Precio Compra': p.precio_compra,
          'Precio Venta': p.precio_venta, 'Stock Actual': p.stock_actual,
          'Stock Minimo': p.stock_minimo,
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'Productos_Inventario.xlsx');
      });
    });
  }
}
