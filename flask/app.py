
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mysqldb import MySQL
from datetime import date

app = Flask(__name__)

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'pizzeria'
app.config['MYSQL_PORT'] = 3306

mysql = MySQL(app)
CORS(app)


@app.route('/', methods=['GET'])
def inicio():
    return jsonify({
        'mensaje': 'API de Pizzeria funcionando',
        'exito': True
    })


@app.route('/api/pedidos', methods=['GET'])
def consultar_pedidos():
    cursor = None

    try:
        cursor = mysql.connection.cursor()

        cursor.execute(
            "SELECT idpedido, nombre, direccion, telefono, fecha, total FROM pedidos"
        )

        datos = cursor.fetchall()
        pedidos = []

        for fila in datos:
            pedidos.append({
                'idpedido': fila[0],
                'nombre': fila[1],
                'direccion': fila[2],
                'telefono': fila[3],
                'fecha': fila[4].isoformat(),
                'total': float(fila[5])
            })

        return jsonify({
            'pedidos': pedidos,
            'exito': True
        }), 200

    except Exception as ex:
        print(ex)

        return jsonify({
            'mensaje': 'Error al consultar pedidos',
            'exito': False
        }), 500

    finally:
        if cursor is not None:
            cursor.close()


@app.route('/api/pedidos', methods=['POST'])
def registrar_pedido():
    cursor = None

    try:
        datos = request.get_json(silent=True)

        if not isinstance(datos, dict):
            return jsonify({
                'mensaje': 'Datos del pedido no válidos',
                'exito': False
            }), 400

        nombre = str(datos.get('nombre') or '').strip()
        direccion = str(datos.get('direccion') or '').strip()
        telefono = str(datos.get('telefono') or '').strip()
        fecha = datos.get('fecha')
        pizzas = datos.get('pizzas')

        if not nombre or not direccion or not telefono:
            return jsonify({
                'mensaje': 'Completa los datos del cliente',
                'exito': False
            }), 400

        try:
            date.fromisoformat(fecha)
        except (ValueError, TypeError):
            return jsonify({
                'mensaje': 'Fecha no válida',
                'exito': False
            }), 400

        if not isinstance(pizzas, list) or len(pizzas) == 0:
            return jsonify({
                'mensaje': 'Agrega al menos una pizza',
                'exito': False
            }), 400

        precios = {
            'chica': 40,
            'mediana': 80,
            'grande': 120
        }

        ingredientes_validos = {
            'Jamón',
            'Piña',
            'Champiñones'
        }

        detalles = []
        total = 0

        for pizza in pizzas:
            if not isinstance(pizza, dict):
                raise ValueError('Pizza no válida')

            tamano = pizza.get('tamano')
            ingredientes = pizza.get('ingredientes')
            cantidad = pizza.get('cantidad')

            if tamano not in precios:
                raise ValueError('Tamaño de pizza no válido')

            if not isinstance(ingredientes, list):
                raise ValueError('Ingredientes no válidos')

            if len(ingredientes) != len(set(ingredientes)):
                raise ValueError('Ingredientes duplicados')

            if not set(ingredientes).issubset(ingredientes_validos):
                raise ValueError('Ingrediente no válido')

            if type(cantidad) is not int or cantidad < 1:
                raise ValueError('Cantidad no válida')

            subtotal = (
                precios[tamano] + len(ingredientes) * 10
            ) * cantidad

            detalles.append((
                tamano,
                ', '.join(ingredientes),
                cantidad,
                subtotal
            ))

            total += subtotal

        cursor = mysql.connection.cursor()

        sql_pedido = """
            INSERT INTO pedidos
            (nombre, direccion, telefono, fecha, total)
            VALUES (%s, %s, %s, %s, %s)
        """

        cursor.execute(sql_pedido, (
            nombre,
            direccion,
            telefono,
            fecha,
            total
        ))

        idpedido = cursor.lastrowid

        sql_detalle = """
            INSERT INTO detalle_pedido
            (idpedido, tamano, ingredientes, cantidad, subtotal)
            VALUES (%s, %s, %s, %s, %s)
        """

        for detalle in detalles:
            cursor.execute(sql_detalle, (
                idpedido,
                detalle[0],
                detalle[1],
                detalle[2],
                detalle[3]
            ))

        mysql.connection.commit()

        return jsonify({
            'mensaje': 'Pedido registrado correctamente',
            'idpedido': idpedido,
            'total': total,
            'exito': True
        }), 201

    except ValueError as ex:
        return jsonify({
            'mensaje': str(ex),
            'exito': False
        }), 400

    except Exception as ex:
        mysql.connection.rollback()
        print(ex)

        return jsonify({
            'mensaje': 'Error al registrar pedido',
            'exito': False
        }), 500

    finally:
        if cursor is not None:
            cursor.close()


@app.route('/api/ventas/dia/<dia>', methods=['GET'])
def ventas_por_dia(dia):
    cursor = None

    dias = {
        'lunes': 0,
        'martes': 1,
        'miercoles': 2,
        'miércoles': 2,
        'jueves': 3,
        'viernes': 4,
        'sabado': 5,
        'sábado': 5,
        'domingo': 6
    }

    dia = dia.lower()

    if dia not in dias:
        return jsonify({
            'mensaje': 'Día no válido',
            'exito': False
        }), 400

    try:
        cursor = mysql.connection.cursor()

        cursor.execute("""
            SELECT idpedido, nombre, fecha, total
            FROM pedidos
            WHERE WEEKDAY(fecha) = %s
            ORDER BY fecha DESC
        """, (dias[dia],))

        datos = cursor.fetchall()

        ventas = []
        total_ventas = 0

        for fila in datos:
            ventas.append({
                'idpedido': fila[0],
                'nombre': fila[1],
                'fecha': fila[2].isoformat(),
                'total': float(fila[3])
            })

            total_ventas += float(fila[3])

        return jsonify({
            'ventas': ventas,
            'total_ventas': total_ventas,
            'exito': True
        }), 200

    except Exception as ex:
        print(ex)

        return jsonify({
            'mensaje': 'Error al consultar ventas por día',
            'exito': False
        }), 500

    finally:
        if cursor is not None:
            cursor.close()


@app.route('/api/ventas/mes/<mes>', methods=['GET'])
def ventas_por_mes(mes):
    cursor = None

    meses = {
        'enero': 1,
        'febrero': 2,
        'marzo': 3,
        'abril': 4,
        'mayo': 5,
        'junio': 6,
        'julio': 7,
        'agosto': 8,
        'septiembre': 9,
        'octubre': 10,
        'noviembre': 11,
        'diciembre': 12
    }

    mes = mes.lower()

    if mes not in meses:
        return jsonify({
            'mensaje': 'Mes no válido',
            'exito': False
        }), 400

    try:
        cursor = mysql.connection.cursor()

        cursor.execute("""
            SELECT idpedido, nombre, fecha, total
            FROM pedidos
            WHERE MONTH(fecha) = %s
            ORDER BY fecha DESC
        """, (meses[mes],))

        datos = cursor.fetchall()

        ventas = []
        total_ventas = 0

        for fila in datos:
            ventas.append({
                'idpedido': fila[0],
                'nombre': fila[1],
                'fecha': fila[2].isoformat(),
                'total': float(fila[3])
            })

            total_ventas += float(fila[3])

        return jsonify({
            'ventas': ventas,
            'total_ventas': total_ventas,
            'exito': True
        }), 200

    except Exception as ex:
        print(ex)

        return jsonify({
            'mensaje': 'Error al consultar ventas por mes',
            'exito': False
        }), 500

    finally:
        if cursor is not None:
            cursor.close()


@app.route('/api/pedidos/<int:idpedido>/detalle', methods=['GET'])
def consultar_detalle_pedido(idpedido):
    cursor = None

    try:
        cursor = mysql.connection.cursor()

        cursor.execute("""
            SELECT idpedido, nombre, direccion, telefono, fecha, total
            FROM pedidos
            WHERE idpedido = %s
        """, (idpedido,))

        fila = cursor.fetchone()

        if fila is None:
            return jsonify({
                'mensaje': 'Pedido no encontrado',
                'exito': False
            }), 404

        pedido = {
            'idpedido': fila[0],
            'nombre': fila[1],
            'direccion': fila[2],
            'telefono': fila[3],
            'fecha': fila[4].isoformat(),
            'total': float(fila[5])
        }

        cursor.execute("""
            SELECT tamano, ingredientes, cantidad, subtotal
            FROM detalle_pedido
            WHERE idpedido = %s
            ORDER BY iddetalle
        """, (idpedido,))

        datos = cursor.fetchall()
        pizzas = []

        for fila in datos:
            pizzas.append({
                'tamano': fila[0],
                'ingredientes': fila[1].split(', ') if fila[1] else [],
                'cantidad': fila[2],
                'subtotal': float(fila[3])
            })

        return jsonify({
            'pedido': pedido,
            'pizzas': pizzas,
            'exito': True
        }), 200

    except Exception as ex:
        print(ex)

        return jsonify({
            'mensaje': 'Error al consultar el detalle del pedido',
            'exito': False
        }), 500

    finally:
        if cursor is not None:
            cursor.close()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
