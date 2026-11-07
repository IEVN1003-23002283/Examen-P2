
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PizzaDetalle } from '../componentes/detalle-pedido/detalle-pedido';

export interface PedidoNuevo {
  nombre: string;
  direccion: string;
  telefono: string;
  fecha: string;
  pizzas: PizzaDetalle[];
}

export interface RespuestaPedido {
  mensaje: string;
  idpedido: number;
  total: number;
  exito: boolean;
}

export interface VentaRegistrada {
  idpedido: number;
  nombre: string;
  direccion: string;
  telefono: string;
  fecha: string;
  total: number;
}

export interface RespuestaVentas {
  ventas: VentaRegistrada[];
  total_ventas: number;
  exito: boolean;
}

export interface DetalleVenta {
  pedido: VentaRegistrada;
  pizzas: PizzaDetalle[];
  exito: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Pedidos {

  private apiUrl = 'http://127.0.0.1:5000/api';

  constructor(private http: HttpClient) {}

  registrarPedido(datos: PedidoNuevo): Observable<RespuestaPedido> {
    return this.http.post<RespuestaPedido>(
      `${this.apiUrl}/pedidos`,
      datos
    );
  }

  consultarPedidos(): Observable<{
    pedidos: VentaRegistrada[];
    exito: boolean;
  }> {
    return this.http.get<{
      pedidos: VentaRegistrada[];
      exito: boolean;
    }>(`${this.apiUrl}/pedidos`);
  }

  consultarVentasDia(dia: string): Observable<RespuestaVentas> {
    return this.http.get<RespuestaVentas>(
      `${this.apiUrl}/ventas/dia/${encodeURIComponent(dia)}`
    );
  }

  consultarVentasMes(mes: string): Observable<RespuestaVentas> {
    return this.http.get<RespuestaVentas>(
      `${this.apiUrl}/ventas/mes/${encodeURIComponent(mes)}`
    );
  }

  consultarDetalle(idpedido: number): Observable<DetalleVenta> {
    return this.http.get<DetalleVenta>(
      `${this.apiUrl}/pedidos/${idpedido}/detalle`
    );
  }
}
