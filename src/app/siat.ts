import { Injectable } from '@angular/core';

export interface CUFDResponse {
  codigo: string;
  fechaVigencia: string;
  transaccion: number;
  codigoControl: string;
}

export interface SiatConfiguration {
  nit: string;
  codigoSistema: number;
  codigoAmbiente: number; // 1 = Producción, 2 = Pruebas
  codigoModalidad: number; // 1 = Electronica, 2 = En línea
  codigoEmision: number; // 1 = Online, 2 = Offline
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class SiatService {
  private config: SiatConfiguration = {
    nit: '1234567890',
    codigoSistema: 775566889,
    codigoAmbiente: 2, // Pruebas
    codigoModalidad: 2, // En línea
    codigoEmision: 1, // Online
    token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9...' // Token simulado
  };

  private currentCUFD: CUFDResponse | null = null;

  constructor() {
    console.log('🌐 Servicio SIAT inicializado (MODO SIMULACIÓN)');
  }

  // Simular obtención de CUFD diario
  async solicitarCUFD(): Promise<CUFDResponse> {
    console.log('📡 Solicitando CUFD al SIAT...');
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const today = new Date().toISOString().split('T')[0];
    const cufd: CUFDResponse = {
      codigo: this.generarCUFD(),
      fechaVigencia: today,
      transaccion: Math.floor(Math.random() * 1000000),
      codigoControl: this.generarCodigoControl()
    };
    
    this.currentCUFD = cufd;
    console.log('✅ CUFD obtenido:', cufd);
    return cufd;
  }

  // Generar CUF para factura individual
  generarCUF(numeroFactura: number, fechaEmision: string): string {
    const nit = this.config.nit.toString();
    const fecha = fechaEmision.replace(/-/g, '');
    const sucursal = '0001';
    const puntoVenta = '001';
    const numero = numeroFactura.toString().padStart(8, '0');
    const modalidad = this.config.codigoModalidad.toString();
    const emision = this.config.codigoEmision.toString();
    const ambiente = this.config.codigoAmbiente.toString();
    
    // Algoritmo simplificado para generar CUF
    const base = nit + fecha + sucursal + puntoVenta + numero + modalidad + emision + ambiente;
    return this.calcularCUF(base);
  }

  // Simular envío de factura al SIAT
  async enviarFactura(facturaData: any): Promise<{exito: boolean, cuf?: string, mensaje: string}> {
    console.log('📤 Enviando factura al SIAT...', facturaData);
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!this.currentCUFD) {
      return {
        exito: false,
        mensaje: 'Error: No hay CUFD vigente. Solicite uno primero.'
      };
    }
    
    // Simular 95% de éxito
    const exitoso = Math.random() < 0.95;
    
    if (exitoso) {
      const cuf = this.generarCUF(facturaData.numero, facturaData.fecha);
      return {
        exito: true,
        cuf: cuf,
        mensaje: 'Factura registrada correctamente en SIAT'
      };
    } else {
      return {
        exito: false,
        mensaje: 'Error de conexión con SIAT. Reintente más tarde.'
      };
    }
  }

  // Obtener estado de conexión SIAT
  async verificarConexionSiat(): Promise<{conectado: boolean, mensaje: string}> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular 90% de conexión exitosa
    const conectado = Math.random() < 0.9;
    
    return {
      conectado,
      mensaje: conectado ? 'Conexión SIAT exitosa' : 'Sin conexión a SIAT'
    };
  }

  getCUFDVigente(): CUFDResponse | null {
    return this.currentCUFD;
  }

  private generarCUFD(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generarCodigoControl(): string {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  }

  private calcularCUF(base: string): string {
    // Algoritmo simplificado para demo
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      const char = base.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(32, '0');
  }
}