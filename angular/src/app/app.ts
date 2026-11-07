
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido, DatosCliente } from './componentes/pedido/pedido';
import { DetallePedido, PizzaDetalle } from './componentes/detalle-pedido/detalle-pedido';
import { Ventas, Venta, ConsultaVentas } from './componentes/ventas/ventas';
import { Pedidos, DetalleVenta } from './servicios/pedidos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Pedido, DetallePedido, Ventas],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  pizzas: PizzaDetalle[] = [];
  ventas: Venta[] = [];

  detalleSeleccionado: DetalleVenta | null = null;
  mensajeDetalle: string = '';

  cliente: DatosCliente = {
    nombre: '',
    direccion: '',
    telefono: '',
    fecha: ''
  };

  guardando: boolean = false;

  constructor(
    private pedidosApi: Pedidos,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarVentas();
  }

  actualizarCliente(datos: DatosCliente): void {
    this.cliente = datos;
  }

  agregarPizza(pizza: PizzaDetalle): void {
    this.pizzas = [...this.pizzas, pizza];
  }

  quitarPizza(indice: number): void {
    this.pizzas = this.pizzas.filter((_, i) => i !== indice);
  }

  cargarVentas(): void {
    this.detalleSeleccionado = null;

    this.pedidosApi.consultarPedidos().subscribe({
      next: (response) => {
        const hoy = new Date();
        const fechaHoy = [
          hoy.getFullYear(),
          String(hoy.getMonth() + 1).padStart(2, '0'),
          String(hoy.getDate()).padStart(2, '0')
        ].join('-');

        this.ventas = response.pedidos
          .filter(pedido => pedido.fecha === fechaHoy)
          .map(pedido => ({
            idpedido: pedido.idpedido,
            nombre: pedido.nombre,
            fecha: pedido.fecha,
            total: pedido.total
          }));

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al consultar ventas:', error);
        this.cdr.markForCheck();
      }
    });
  }

  consultarVentas(consulta: ConsultaVentas): void {
    this.detalleSeleccionado = null;

    const peticion = consulta.tipo === 'dia'
      ? this.pedidosApi.consultarVentasDia(consulta.valor)
      : this.pedidosApi.consultarVentasMes(consulta.valor);

    peticion.subscribe({
      next: (response) => {
        this.ventas = response.ventas.map(venta => ({
          idpedido: venta.idpedido,
          nombre: venta.nombre,
          fecha: venta.fecha,
          total: venta.total
        }));

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al consultar ventas:', error);
        alert('Error al consultar las ventas');
        this.cdr.markForCheck();
      }
    });
  }

  verDetalleVenta(idpedido: number): void {
    this.detalleSeleccionado = null;
    this.mensajeDetalle = '';

    this.pedidosApi.consultarDetalle(idpedido).subscribe({
      next: (response) => {
        this.detalleSeleccionado = response;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al consultar detalle:', error);
        this.mensajeDetalle = 'No se pudo consultar el detalle';
        this.cdr.markForCheck();
      }
    });
  }

  cerrarDetalle(): void {
    this.detalleSeleccionado = null;
    this.mensajeDetalle = '';
  }

  terminarPedido(): void {
    if (this.guardando) {
      return;
    }

    if (this.pizzas.length === 0) {
      alert('Agrega al menos una pizza');
      return;
    }

    if (
      !this.cliente.nombre.trim() ||
      !this.cliente.direccion.trim() ||
      !this.cliente.telefono.trim() ||
      !this.cliente.fecha
    ) {
      alert('Completa los datos del cliente');
      return;
    }

    this.guardando = true;

    this.pedidosApi.registrarPedido({
      nombre: this.cliente.nombre,
      direccion: this.cliente.direccion,
      telefono: this.cliente.telefono,
      fecha: this.cliente.fecha,
      pizzas: this.pizzas
    }).subscribe({
      next: (response) => {
        if (response.exito) {
          alert(
            'Pedido registrado correctamente. Total: $' +
            response.total
          );

          this.pizzas = [];
          this.cargarVentas();
        } else {
          alert(response.mensaje);
        }

        this.guardando = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al registrar pedido:', error);
        alert(error.error?.mensaje || 'Error al guardar el pedido');
        this.guardando = false;
        this.cdr.markForCheck();
      }
    });
  }
}
