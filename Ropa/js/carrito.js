document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    const carritoIcono = document.querySelector('.carrito-icono');
    const carrito = document.querySelector('.carrito');
    const carritoContenido = document.querySelector('.carrito-contenido');
    const carritoTotal = document.querySelector('.carrito-total span');
    const carritoContador = document.querySelector('.carrito-contador');
    const btnVaciar = document.querySelector('.btn-vaciar');
    const btnPagar = document.querySelector('.btn-pagar');
    
    // Cargar carrito desde localStorage o inicializar vacío
    let carritoItems = JSON.parse(localStorage.getItem('carritoItems')) || [];

    // Abrir/cerrar carrito
    function toggleCarrito(abrir = null) {
        if (abrir === true) {
            carrito.classList.add('active');
        } else if (abrir === false) {
            carrito.classList.remove('active');
        } else {
            carrito.classList.toggle('active');
        }
    }

    carritoIcono.addEventListener('click', function() {
        toggleCarrito();
    });

    // Actualizar carrito al cargar la página
    actualizarCarrito();

    // Delegación de eventos para los botones "Añadir al carrito"
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-anadir')) {
            const producto = e.target.closest('.producto');
            añadirAlCarrito(producto);
        }
    });

    // Función para añadir productos al carrito
    function añadirAlCarrito(producto) {
        const id = producto.getAttribute('data-id');
        const nombre = producto.querySelector('h3').textContent;
        const precio = parseFloat(producto.querySelector('p').textContent.replace('$', ''));
        const imagen = producto.querySelector('img').src;
        const categoria = producto.getAttribute('data-categoria');

        const itemExistente = carritoItems.find(item => item.id === id);

        if (itemExistente) {
            itemExistente.cantidad++;
        } else {
            carritoItems.push({
                id,
                nombre,
                precio,
                imagen,
                categoria,
                cantidad: 1
            });
        }

        actualizarCarrito();
        guardarCarritoLocalStorage();
        mostrarNotificacion(`${nombre} añadido al carrito`);
        toggleCarrito(true); // Abre el carrito al añadir un producto
    }

    // Actualizar la visualización del carrito
    function actualizarCarrito() {
        carritoContenido.innerHTML = '';
        let total = 0;

        if (carritoItems.length === 0) {
            carritoContenido.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío</p>';
            carritoTotal.textContent = '$0.00';
            carritoContador.textContent = '0';
            btnPagar.disabled = true;
            return;
        }

        carritoItems.forEach(item => {
            const carritoItem = document.createElement('div');
            carritoItem.classList.add('carrito-item');
            carritoItem.innerHTML = `
                <img src="${item.imagen}" alt="${item.nombre}">
                <div class="carrito-item-info">
                    <h3>${item.nombre}</h3>
                    <p>$${item.precio.toFixed(2)}</p>
                    <div class="carrito-item-cantidad">
                        <button class="btn-disminuir" data-id="${item.id}">-</button>
                        <span>${item.cantidad}</span>
                        <button class="btn-aumentar" data-id="${item.id}">+</button>
                    </div>
                </div>
                <div class="carrito-item-eliminar" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </div>
            `;

            carritoContenido.appendChild(carritoItem);
            total += item.precio * item.cantidad;
        });

        carritoTotal.textContent = `$${total.toFixed(2)}`;
        carritoContador.textContent = carritoItems.reduce((sum, item) => sum + item.cantidad, 0);
        btnPagar.disabled = false;

        // Añadir event listeners a los nuevos botones
        document.querySelectorAll('.btn-disminuir').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                modificarCantidad(btn.getAttribute('data-id'), 'decrementar');
            });
        });

        document.querySelectorAll('.btn-aumentar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                modificarCantidad(btn.getAttribute('data-id'), 'incrementar');
            });
        });

        document.querySelectorAll('.carrito-item-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                eliminarItem(btn.getAttribute('data-id'));
            });
        });
    }

    // Modificar cantidad de un item
    function modificarCantidad(id, operacion) {
        const item = carritoItems.find(item => item.id === id);
        
        if (operacion === 'incrementar') {
            item.cantidad++;
        } else if (operacion === 'decrementar') {
            if (item.cantidad > 1) {
                item.cantidad--;
            } else {
                eliminarItem(id);
                return;
            }
        }

        actualizarCarrito();
        guardarCarritoLocalStorage();
    }

    // Eliminar un item del carrito
    function eliminarItem(id) {
        const itemEliminado = carritoItems.find(item => item.id === id);
        carritoItems = carritoItems.filter(item => item.id !== id);
        actualizarCarrito();
        guardarCarritoLocalStorage();
        mostrarNotificacion(`${itemEliminado.nombre} eliminado del carrito`);
    }

    // Vaciar el carrito completamente
    btnVaciar.addEventListener('click', function(e) {
        e.stopPropagation();
        carritoItems = [];
        actualizarCarrito();
        guardarCarritoLocalStorage();
        mostrarNotificacion('Carrito vaciado');
    });

    // Proceso de pago con Stripe
    btnPagar.addEventListener('click', function(e) {
        e.stopPropagation();
        if (carritoItems.length === 0) {
            mostrarNotificacion('Tu carrito está vacío', 'error');
            return;
        }
        
        // Crear objeto con los datos del carrito
        const pedido = {
            items: carritoItems.map(item => ({
                id: item.id,
                nombre: item.nombre,
                precio: item.precio,
                cantidad: item.cantidad,
                imagen: item.imagen
            })),
            total: parseFloat(carritoTotal.textContent.replace('$', ''))
        };

        // Guardar en sessionStorage para la página de pago
        sessionStorage.setItem('pedidoActual', JSON.stringify(pedido));
        
        // Redirigir a pago.html con el total como parámetro
        window.location.href = `pago.html?total=${pedido.total.toFixed(2)}`;
    });

    // Guardar carrito en localStorage
    function guardarCarritoLocalStorage() {
        localStorage.setItem('carritoItems', JSON.stringify(carritoItems));
    }

    // Mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo = 'success') {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);

        setTimeout(() => {
            notificacion.classList.add('mostrar');
        }, 10);

        setTimeout(() => {
            notificacion.classList.remove('mostrar');
            setTimeout(() => {
                document.body.removeChild(notificacion);
            }, 300);
        }, 3000);
    }

    // Cerrar carrito al hacer clic fuera
    document.addEventListener('click', function(e) {
        const esElementoCarrito = e.target.closest('.carrito') || 
                               e.target.closest('.carrito-icono') ||
                               e.target.closest('.btn-anadir');
        
        if (!esElementoCarrito && !e.target.closest('.carrito-item-cantidad') && 
            !e.target.closest('.carrito-item-eliminar') && 
            !e.target.closest('.btn-vaciar') && 
            !e.target.closest('.btn-pagar')) {
            carrito.classList.remove('active');
        }
    });

    // Cargar carrito desde otras páginas al volver
    window.addEventListener('pageshow', function() {
        const carritoGuardado = JSON.parse(localStorage.getItem('carritoItems'));
        if (carritoGuardado) {
            carritoItems = carritoGuardado;
            actualizarCarrito();
        }
    });
});