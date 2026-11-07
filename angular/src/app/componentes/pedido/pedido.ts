
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PizzaDetalle } from '../detalle-pedido/detalle-pedido';

export interface DatosCliente {
  nombre: string;
  direccion: string;
  telefono: string;
  fecha: string;
}

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pedido.html',
  styleUrl: './pedido.css'
})
export class Pedido {

  @Output() pizzaAgregada = new EventEmitter<PizzaDetalle>();
  @Output() clienteActualizado = new EventEmitter<DatosCliente>();

  formulario: FormGroup;

  constructor(private fb: FormBuilder) {
    const hoy = new Date();
    const fechaLocal = [
      hoy.getFullYear(),
      String(hoy.getMonth() + 1).padStart(2, '0'),
      String(hoy.getDate()).padStart(2, '0')
    ].join('-');

    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required],
      fecha: [fechaLocal, Validators.required],
      tamano: ['chica', Validators.required],
      jamon: [false],
      pina: [false],
      champinones: [false],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]]
    });

    this.formulario.valueChanges.subscribe(() => {
      this.enviarDatosCliente();
    });
  }

  enviarDatosCliente(): void {
    const datos = this.formulario.value;

    this.clienteActualizado.emit({
      nombre: datos.nombre,
      direccion: datos.direccion,
      telefono: datos.telefono,
      fecha: datos.fecha
    });
  }

  agregarPizza(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = this.formulario.value;

    const precios: Record<string, number> = {
      chica: 40,
      mediana: 80,
      grande: 120
    };

    const ingredientes: string[] = [];

    if (datos.jamon) ingredientes.push('Jamón');
    if (datos.pina) ingredientes.push('Piña');
    if (datos.champinones) ingredientes.push('Champiñones');

    const cantidad = Number(datos.cantidad);

    const pizza: PizzaDetalle = {
      tamano: datos.tamano,
      ingredientes: ingredientes,
      cantidad: cantidad,
      subtotal: (precios[datos.tamano] + ingredientes.length * 10) * cantidad
    };

    this.enviarDatosCliente();
    this.pizzaAgregada.emit(pizza);

    this.formulario.patchValue({
      tamano: 'chica',
      jamon: false,
      pina: false,
      champinones: false,
      cantidad: 1
    });
  }
}
