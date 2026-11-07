
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Venta {
  idpedido?: number;
  nombre: string;
  fecha?: string;
  total: number;
}

export interface ConsultaVentas {
  tipo: 'dia' | 'mes';
  valor: string;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css'
})
export class Ventas {

  @Input() ventas: Venta[] = [];

  @Output() consultar = new EventEmitter<ConsultaVentas>();
  @Output() mostrarHoy = new EventEmitter<void>();
  @Output() verDetalle = new EventEmitter<number>();

  tipoConsulta: 'dia' | 'mes' = 'dia';
  valorConsulta: string = '';
  mensaje: string = '';

  dias: string[] = [
    'lunes', 'martes', 'miercoles', 'jueves',
    'viernes', 'sabado', 'domingo'
  ];

  meses: string[] = [
    'enero', 'febrero', 'marzo', 'abril',
    'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  get opciones(): string[] {
    return this.tipoConsulta === 'dia' ? this.dias : this.meses;
  }

  get totalVentas(): number {
    return this.ventas.reduce(
      (suma, venta) => suma + venta.total, 0
    );
  }

  cambiarTipo(): void {
    this.valorConsulta = '';
    this.mensaje = '';
  }

  consultarVentas(): void {
    if (!this.valorConsulta) {
      this.mensaje = 'Selecciona un día o un mes';
      return;
    }

    this.mensaje = '';

    this.consultar.emit({
      tipo: this.tipoConsulta,
      valor: this.valorConsulta
    });
  }

  consultarHoy(): void {
    this.mensaje = '';
    this.mostrarHoy.emit();
  }

  mostrarDetalle(idpedido?: number): void {
  console.log('Botón Ver detalle presionado. ID:', idpedido);

  if (idpedido !== undefined) {
    this.verDetalle.emit(idpedido);
  }
}
}
