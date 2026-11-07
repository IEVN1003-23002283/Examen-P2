
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PizzaDetalle {
  tamano: string;
  ingredientes: string[];
  cantidad: number;
  subtotal: number;
}

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-pedido.html',
  styleUrl: './detalle-pedido.css'
})
export class DetallePedido {

  @Input() pizzas: PizzaDetalle[] = [];

  @Output() quitar = new EventEmitter<number>();
  @Output() terminar = new EventEmitter<void>();

  seleccionada: number | null = null;

  get total(): number {
    return this.pizzas.reduce((suma, pizza) => suma + pizza.subtotal, 0);
  }

  quitarPizza(): void {
    if (this.seleccionada !== null) {
      this.quitar.emit(this.seleccionada);
      this.seleccionada = null;
    }
  }

  terminarPedido(): void {
    if (this.pizzas.length > 0) {
      this.terminar.emit();
    }
  }
}
