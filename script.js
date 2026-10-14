
/* ======================================
   JUEGO: DESCUBRE LA IMAGEN 5 x 5
====================================== */

const tablero = document.getElementById("tablero");
const selectorImagen = document.getElementById("selectorImagen");
const selectorCarpeta = document.getElementById("selectorCarpeta");
const nombreCarpeta = document.getElementById("nombreCarpeta");

const operacionTexto = document.getElementById("operacion");
const respuestaInput = document.getElementById("respuesta");
const mensaje = document.getElementById("mensaje");
const progreso = document.getElementById("progreso");

const comprobarBtn = document.getElementById("comprobar");
const nuevoJuegoBtn = document.getElementById("nuevoJuego");
const modoAleatorio = document.getElementById("modoAleatorio");

const TAMANO = 5;
const TOTAL_CUADROS = TAMANO * TAMANO;

let imagenURL = null;
let cuadros = [];
let cuadroSeleccionado = null;
let respuestaCorrecta = null;
let juegoTerminado = false;

let proporcionImagen = 1;

/* ======================================
   IMÁGENES DE LA CARPETA
====================================== */

let imagenesCarpeta = [];
let archivoActualCarpeta = null;

/* ======================================
   CARGAR UNA IMAGEN
====================================== */

function cargarImagenArchivo(archivo, mensajeExito) {
    if (!archivo || !archivo.type.startsWith("image/")) {
        mensaje.textContent = "Selecciona una imagen válida.";
        return;
    }

    const lector = new FileReader();

    lector.onload = function (evento) {
        const imagen = new Image();

        imagen.onload = function () {
            imagenURL = evento.target.result;

            proporcionImagen =
                imagen.naturalWidth / imagen.naturalHeight;

            crearTablero();

            mensaje.textContent = mensajeExito;
        };

        imagen.onerror = function () {
            mensaje.textContent =
                "No se pudo procesar la imagen.";
        };

        imagen.src = evento.target.result;
    };

    lector.onerror = function () {
        mensaje.textContent =
            "No se pudo abrir la imagen. Inténtalo otra vez.";
    };

    lector.readAsDataURL(archivo);
}

/* ======================================
   ELEGIR UNA IMAGEN INDIVIDUAL
====================================== */

selectorImagen.addEventListener("change", function (evento) {
    const archivo = evento.target.files[0];

    if (!archivo) {
        return;
    }

    // Al elegir una imagen individual,
    // dejamos de usar la carpeta anterior.
    imagenesCarpeta = [];
    archivoActualCarpeta = null;
    nombreCarpeta.textContent = "";

    cargarImagenArchivo(
        archivo,
        "¡Imagen cargada! Toca un cuadro para comenzar."
    );

    // Permite volver a elegir el mismo archivo.
    selectorImagen.value = "";
});

/* ======================================
   ELEGIR UNA CARPETA
====================================== */

selectorCarpeta.addEventListener("change", function (evento) {
    const archivos = Array.from(evento.target.files || []);

    const imagenes = archivos.filter(function (archivo) {
        return archivo.type.startsWith("image/");
    });

    if (imagenes.length === 0) {
        mensaje.textContent =
            "La carpeta no contiene imágenes compatibles.";

        selectorCarpeta.value = "";
        return;
    }

    imagenesCarpeta = imagenes;
    archivoActualCarpeta = null;

    nombreCarpeta.textContent =
        `${imagenesCarpeta.length} imagen(es) disponibles`;

    // Cargar una imagen aleatoria de la carpeta.
    cargarImagenAleatoriaCarpeta();

    // Permite volver a seleccionar la misma carpeta.
    selectorCarpeta.value = "";
});

/* ======================================
   ELEGIR UNA IMAGEN ALEATORIA
====================================== */

function cargarImagenAleatoriaCarpeta() {
    if (imagenesCarpeta.length === 0) {
        mensaje.textContent =
            "Primero elige una carpeta con imágenes.";
        return;
    }

    let indice = numeroAleatorio(0, imagenesCarpeta.length - 1);

    // Si hay varias imágenes, intentar no repetir
    // la que se utilizó en la partida anterior.
    if (imagenesCarpeta.length > 1) {
        let intentos = 0;

        while (
            imagenesCarpeta[indice] === archivoActualCarpeta &&
            intentos < 20
        ) {
            indice = numeroAleatorio(
                0,
                imagenesCarpeta.length - 1
            );

            intentos++;
        }
    }

    const archivo = imagenesCarpeta[indice];

    archivoActualCarpeta = archivo;

    cargarImagenArchivo(
        archivo,
        "¡Nueva imagen! Toca un cuadro para comenzar."
    );
}

/* ======================================
   CREAR EL TABLERO
====================================== */

function crearTablero() {
    tablero.innerHTML = "";
    tablero.classList.remove("completado");

    cuadros = [];
    cuadroSeleccionado = null;
    respuestaCorrecta = null;
    juegoTerminado = false;

    tablero.style.aspectRatio = `${proporcionImagen}`;

    tablero.style.gridTemplateColumns =
        `repeat(${TAMANO}, minmax(0, 1fr))`;

    tablero.style.gridTemplateRows =
        `repeat(${TAMANO}, minmax(0, 1fr))`;

    for (let i = 0; i < TOTAL_CUADROS; i++) {
        const cuadro = document.createElement("button");

        cuadro.type = "button";
        cuadro.className = "cuadro bloqueado";

        cuadro.setAttribute(
            "aria-label",
            `Cuadro ${i + 1}`
        );

        cuadro.addEventListener("click", function () {
            seleccionarCuadro(i);
        });

        tablero.appendChild(cuadro);

        cuadros.push({
            elemento: cuadro,
            descubierto: false,
            operacion: crearOperacion()
        });
    }

    operacionTexto.textContent = "---";
    respuestaInput.value = "";

    mensaje.textContent = imagenURL
        ? "Toca un cuadro para comenzar."
        : "Elige una imagen o una carpeta.";

    actualizarProgreso();

    if (modoAleatorio.checked && imagenURL) {
        seleccionarCuadroAleatorio();
    }
}

/* ======================================
   SELECCIONAR UN CUADRO ALEATORIO
====================================== */

function seleccionarCuadroAleatorio() {
    if (
        juegoTerminado ||
        !imagenURL ||
        !modoAleatorio.checked
    ) {
        return;
    }

    const disponibles = cuadros
        .map((cuadro, indice) => ({ cuadro, indice }))
        .filter(item => !item.cuadro.descubierto);

    if (disponibles.length === 0) {
        return;
    }

    const elegido = disponibles[
        numeroAleatorio(0, disponibles.length - 1)
    ];

    seleccionarCuadro(elegido.indice);
}

/* ======================================
   SELECCIONAR UN CUADRO
====================================== */

function seleccionarCuadro(indice) {
    if (juegoTerminado) {
        return;
    }

    // En modo aleatorio no se puede cambiar de
    // cuadro mientras haya uno pendiente.
    if (
        modoAleatorio.checked &&
        cuadroSeleccionado !== null
    ) {
        return;
    }

    if (!imagenURL) {
        mensaje.textContent =
            "Primero elige una imagen o una carpeta.";
        return;
    }

    const cuadro = cuadros[indice];

    if (cuadro.descubierto) {
        mensaje.textContent =
            "Ese cuadro ya está descubierto.";
        return;
    }

    cuadroSeleccionado = indice;

    cuadros.forEach(function (c) {
        c.elemento.classList.remove("seleccionado");
    });

    cuadro.elemento.classList.add("seleccionado");

    const operacion = cuadro.operacion;

    operacionTexto.textContent = operacion.texto;
    respuestaCorrecta = operacion.respuesta;

    respuestaInput.value = "";

    mensaje.textContent =
        "Resuelve la operación para descubrir el cuadro.";

    respuestaInput.focus();
}

/* ======================================
   CREAR UNA OPERACIÓN MATEMÁTICA
====================================== */

function crearOperacion() {
    const tipos = ["+", "-", "×", "÷"];

    const tipo = tipos[
        numeroAleatorio(0, tipos.length - 1)
    ];

    let a;
    let b;
    let resultado;

    if (tipo === "+") {
        a = numeroAleatorio(1, 99);
        b = numeroAleatorio(1, 99);

        resultado = a + b;

    } else if (tipo === "-") {
        a = numeroAleatorio(1, 99);
        b = numeroAleatorio(1, a);

        resultado = a - b;

    } else if (tipo === "×") {
        a = numeroAleatorio(1, 12);
        b = numeroAleatorio(1, 12);

        resultado = a * b;

    } else {
        // División exacta.
        b = numeroAleatorio(2, 12);
        resultado = numeroAleatorio(1, 12);

        a = b * resultado;
    }

    return {
        texto: `${a} ${tipo} ${b} = ?`,
        respuesta: resultado
    };
}

/* ======================================
   COMPROBAR LA RESPUESTA
====================================== */

function comprobarRespuesta() {
    if (juegoTerminado) {
        return;
    }

    if (!imagenURL) {
        mensaje.textContent =
            "Primero elige una imagen o una carpeta.";
        return;
    }

    if (cuadroSeleccionado === null) {
        mensaje.textContent =
            "Primero toca un cuadro bloqueado.";
        return;
    }

    const texto = respuestaInput.value.trim();

    if (texto === "") {
        mensaje.textContent = "Escribe tu respuesta.";
        respuestaInput.focus();
        return;
    }

    const respuestaUsuario = Number(texto);

    if (!Number.isFinite(respuestaUsuario)) {
        mensaje.textContent =
            "Introduce un número válido.";
        return;
    }

    if (respuestaUsuario === respuestaCorrecta) {
        descubrirCuadro(cuadroSeleccionado);

        cuadroSeleccionado = null;
        respuestaCorrecta = null;

        operacionTexto.textContent = "---";
        respuestaInput.value = "";

        actualizarProgreso();

        const completado = cuadros.every(function (c) {
            return c.descubierto;
        });

        if (completado) {
            juegoTerminado = true;

            // Quitar espacios y bordes para ver
            // la imagen completa y sin separaciones.
            tablero.classList.add("completado");

            mensaje.textContent =
                "¡Felicidades! Has descubierto toda la imagen.";

            operacionTexto.textContent = "🎉";

        } else if (modoAleatorio.checked) {
            mensaje.textContent = "¡Correcto!";
            seleccionarCuadroAleatorio();

        } else {
            mensaje.textContent =
                "¡Correcto! Has descubierto un cuadro.";
        }

    } else {
        mensaje.textContent =
            "Incorrecto. Inténtalo de nuevo.";

        // La operación permanece guardada.
        respuestaInput.select();
    }
}

/* ======================================
   DESCUBRIR UNA PARTE DE LA IMAGEN
====================================== */

function descubrirCuadro(indice) {
    const cuadro = cuadros[indice];
    const elemento = cuadro.elemento;

    const fila = Math.floor(indice / TAMANO);
    const columna = indice % TAMANO;

    cuadro.descubierto = true;

    elemento.classList.remove(
        "bloqueado",
        "seleccionado"
    );

    elemento.style.backgroundImage =
        `url("${imagenURL}")`;

    elemento.style.backgroundRepeat = "no-repeat";

    elemento.style.backgroundSize =
        `${TAMANO * 100}% ${TAMANO * 100}%`;

    const x = (columna / (TAMANO - 1)) * 100;
    const y = (fila / (TAMANO - 1)) * 100;

    elemento.style.backgroundPosition = `${x}% ${y}%`;

    elemento.disabled = true;
}

/* ======================================
   ACTUALIZAR EL PROGRESO
====================================== */

function actualizarProgreso() {
    const descubiertos = cuadros.filter(function (c) {
        return c.descubierto;
    }).length;

    progreso.textContent =
        `Cuadros descubiertos: ${descubiertos}/${TOTAL_CUADROS}`;
}

/* ======================================
   NÚMEROS ALEATORIOS
====================================== */

function numeroAleatorio(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

/* ======================================
   BOTÓN COMPROBAR Y TECLA ENTER
====================================== */

comprobarBtn.addEventListener(
    "click",
    comprobarRespuesta
);

respuestaInput.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        evento.preventDefault();
        comprobarRespuesta();
    }
});

/* ======================================
   ACTIVAR O DESACTIVAR MODO ALEATORIO
====================================== */

modoAleatorio.addEventListener("change", function () {
    if (modoAleatorio.checked) {
        seleccionarCuadroAleatorio();
    }
});

/* ======================================
   NUEVO JUEGO
====================================== */

nuevoJuegoBtn.addEventListener("click", function () {
    if (imagenesCarpeta.length > 0) {
        // Si se eligió una carpeta, cargar otra imagen
        // y crear una partida con operaciones nuevas.
        cargarImagenAleatoriaCarpeta();
    } else if (imagenURL) {
        // Si se eligió una imagen individual,
        // conservarla y reiniciar el tablero.
        crearTablero();
    } else {
        crearTablero();

        mensaje.textContent =
            "Primero elige una imagen o una carpeta.";
    }
});

/* ======================================
   INICIAR EL JUEGO
====================================== */

crearTablero();
