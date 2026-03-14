import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService, Producto, MovimientoKardex } from './inventario.service';

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
    cantidad: 0,
    costo_unitario: 0,
    glosa: '',
  };

  tiposMovimiento = [
    { value: 'entrada_compra',    label: '📥 Entrada por Compra' },
    { value: 'salida_venta',      label: '📤 Salida por Venta' },
    { value: 'ajuste_entrada',    label: '➕ Ajuste Entrada' },
    { value: 'ajuste_salida',     label: '➖ Ajuste Salida' },
    { value: 'devolucion_compra', label: '↩️ Devolución Compra' },
    { value: 'devolucion_venta',  label: '↪️ Devolución Venta' },
  ];

  get productosFiltrados() {
    const q = this.busqueda.toLowerCase();
    return this.productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q)
    );
  }

  get totalProductos()    { return this.productos.length; }
  get totalBajoStock()    { return this.productosBajoStock.length; }
  get valorTotalStock()   {
    return this.productos.reduce((s, p) =>
      s + (p.stock_actual * (p.precio_compra || 0)), 0);
  }

  constructor(private inventarioService: InventarioService) {}

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
    return {
      codigo: '', nombre: '', descripcion: '',
      tipo: 'bien', unidad_medida: 'UND',
      precio_venta: 0, precio_compra: 0,
      controla_stock: true, stock_actual: 0,
      stock_minimo: 0, activo: true,
    };
  }

  async guardarProducto() {
    this.guardando = true;
    try {
      await this.inventarioService.createProducto({
        ...this.productoForm as Producto,
        empresa_id: this.empresaId,
      });
      this.productoForm = this.formVacio();
      this.tabActivo = 'productos';
      await this.cargarDatos();
      alert('✅ Producto registrado correctamente');
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally { this.guardando = false; }
  }

  async registrarMovimiento() {
    this.guardando = true;
    try {
      await this.inventarioService.registrarMovimiento({
        ...this.movimientoForm as MovimientoKardex,
        empresa_id: this.empresaId,
      });
      this.movimientoForm = {
        producto_id: '',
        fecha: new Date().toISOString().split('T')[0],
        tipo_movimiento: 'entrada_compra',
        cantidad: 0, costo_unitario: 0, glosa: '',
      };
      await this.cargarDatos();
      this.tabActivo = 'productos';
      alert('✅ Movimiento registrado');
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally { this.guardando = false; }
  }

  getTipoLabel(tipo: string): string {
    return this.tiposMovimiento.find(t => t.value === tipo)?.label || tipo;
  }

  esEntrada(tipo: string): boolean {
    return ['entrada_compra', 'ajuste_entrada', 'devolucion_venta'].includes(tipo);
  }

  getStockClass(producto: Producto): string {
    if (!producto.controla_stock) return '';
    if (producto.stock_actual <= 0) return 'stock-agotado';
    if (producto.stock_actual <= producto.stock_minimo) return 'stock-bajo';
    return 'stock-ok';
  }
}
