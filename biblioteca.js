/*
Extiende el sistema de biblioteca agregando funcionalidades como: 
- búsqueda avanzada por múltiples criterios (OK)
- sistema de usuarios con historial de préstamos (OK)
- cálculo de multas por retrasos,  (OK)
- reportes de popularidad de libros. (OK)

Usa destructuring, métodos

*/

console.log("=== SISTEMA DE GESTIÓN DE BIBLIOTECA ===\n");


// Base de datos de libros (Estado Central)
let libros = [
  { id: 1, titulo: "JavaScript: The Good Parts", autor: "Douglas Crockford", genero: "Programación", disponible: true, prestadoA: null, fechaPrestamo: null },
  { id: 2, titulo: "Clean Code", autor: "Robert C. Martin", genero: "Programación", disponible: true, prestadoA: null, fechaPrestamo: null },
  { id: 3, titulo: "The Pragmatic Programmer", autor: "Andrew Hunt", genero: "Programación", disponible: true, prestadoA: null, fechaPrestamo: null },
  { id: 4, titulo: "1984", autor: "George Orwell", genero: "Ficción", disponible: true, prestadoA: null, fechaPrestamo: null },
  { id: 5, titulo: "To Kill a Mockingbird", autor: "Harper Lee", genero: "Ficción", disponible: true, prestadoA: null, fechaPrestamo: null }
];

// Base de datos de usuarios 
let usuarios = [
    { id: 101, nombre: "Alicia", historial: [{ libroId: 0, fechaPrestamo: null, fechaDevolucion: null }] },
    { id: 102, nombre: "Beto", historial: [{ libroId: 0, fechaPrestamo: null, fechaDevolucion: null }] },
    { id: 103, nombre: "carla", historial: [{ libroId: 0, fechaPrestamo: null, fechaDevolucion: null }] }
];

// Configuración
const DIAS_MAX_PRESTAMO = 10;
const MULTA_POR_DIA = 0.50; // $0.50 por día de retraso
const fecha = new Date("2025-11-25"); // Fecha actual simulada, inicial

//Funcion para calcular dias de diferencia entre dos fechas
function calcularDiasDiferencia(fechaFin) {
    const fecha_Inicio = fecha // Fecha de préstamo fija
    const fecha_Fin = new Date(fechaFin); // Fecha de devolución proporcionada

    //console.log("Fecha inicio: " + fecha_Inicio);
    //console.log("Fecha fin: " + fecha_Fin);
    const unDia = 24 * 60 * 60 * 1000; // Milisegundos en un día
    const diasDiferencia = Math.round(Math.abs((fecha_Fin - fecha_Inicio) / unDia));

    const retraso = diasDiferencia - DIAS_MAX_PRESTAMO;
    //console.log("retraso: " + diasDiferencia);
    return retraso > 0 ? retraso : 0;
}

//console.log("Dias de diferencia: "+ calcularDiasDiferencia(new Date('2026-11-25'))); // 5 días de diferencia
/* ----------------------------------------------------------------------------------------------------------------------- */
// Sistema de gestión
const biblioteca = {
    // Obtener libros disponibles
    obtenerDisponibles() {
        return libros.filter(libro => libro);
    },


    // Buscar libros por **** genero y disponibilidad ***** 
    // usando destructuring y métodos modernos
    buscarAvanzada(criterio) {
        // Desestructuración y asignación de alias para mayor claridad
        const {
            genero: g = '',
            disponible: d // Valor por defecto implícito (undefined)
        } = criterio;

        //console.log(`${criterio.genero} --- ${d}`); // "Programación" --- true
        const terminoGenero = g.toLowerCase();

        // Usamos reduce para aplicar todos los filtros de forma secuencial y eficiente.
        const filtros = [
            (libro) => libro.genero.toLowerCase().includes(terminoGenero),
            // Filtro condicional: solo se aplica si 'disponible' es true o false
            ...(d !== undefined ? [(libro) => libro.disponible === d] : [])
        ];

        // Aplicamos la reducción de filtros
        return filtros.reduce((librosFiltrados, filtro) =>
            librosFiltrados.filter(filtro), libros
        );
    },

    // Prestar libro
    prestar({ libroId, userId , fecha}) {
        const libro = libros.find(l => l.id === libroId);
        const usuario = usuarios.find(u => u.id === userId);

        if (!libro || !usuario) return { exito: false, mensaje: "Libro o usuario no encontrado" };
        if (!libro.disponible) return { exito: false, mensaje: "Libro no disponible" };


        const fechaPrestamo = new Date(fecha); 

        // Actualización inmutable del libro
        libros = libros.map(l =>
            l.id === libroId ? {
                ...l,
                disponible: false,
                prestadoA: userId,
                fechaPrestamo: fechaPrestamo
            } : l
        );

        // Actualización inmutable del historial del usuario
        usuario.historial = [...usuario.historial, { libroId, fechaPrestamo, fechaDevolucion: null }];

        return {
            exito: true,
            mensaje: `Libro "${libro.titulo}" prestado a ${usuario.nombre}.`
        };
    },

    // Devolver libro
    devolver(libroId, fechaDevolucion) {
        //console.log("Fecha devolución: " + fechaDevolucion);
        const libro = libros.find(l => l.id === libroId);
        if (!libro) return { exito: false, mensaje: "Libro no encontrado" };
        if (libro.disponible) return { exito: false, mensaje: "Este libro ya está disponible" };

        const { prestadoA, fechaPrestamo, titulo } = libro; // Desestructuración del libro
        const diasRetraso = calcularDiasDiferencia(fechaPrestamo);
        const multa = diasRetraso * MULTA_POR_DIA;

        // 1. Actualizar el libro
        libros = libros.map(l =>
            l.id === libroId ? {
                ...l,
                disponible: true,
                prestadoA: null,
                fechaPrestamo: null
            } : l
        );

        // 2. Actualizar el historial del usuario
        const usuario = usuarios.find(u => u.id === prestadoA);
        const registro = usuario.historial.find(h => h.libroId === libroId && h.fechaDevolucion === null);

        if (registro) {
            registro.fechaDevolucion = fechaDevolucion; // Fecha de devolución
        }


        return {
            exito: true,
            mensaje: `Libro "${libro.titulo}" devuelto exitosamente` +
                (multa > 0 ? `. Multa por retraso: $${multa.toFixed(2)}` : '')
        };
    },

    // --- REPORTES Y ESTADÍSTICAS ---
    // Genera un reporte de popularidad basado en el historial de préstamos.

    reportePopularidad() {
        // Reducimos el array de usuarios para obtener una lista plana de todos los IDs de libros prestados
        const historialGlobal = usuarios.flatMap(u =>
            u.historial.map(({ libroId }) => libroId) // Desestructuración en map
        );

        // Reducimos el historial global para contar las ocurrencias de cada libro
        const conteo = historialGlobal.reduce((acc, libroId) => {
            acc[libroId] = (acc[libroId] || 0) + 1;
            return acc;
        }, {});

        // Mapeamos los libros originales y agregamos el contador
        return libros
            .map(libro => ({
                titulo: libro.titulo,
                autor: libro.autor,
                genero: libro.genero,
                prestamos: conteo[libro.id] || 0
            }))
            .sort((a, b) => b.prestamos - a.prestamos);
    },

    // Estadísticas
    obtenerEstadisticas() {
        const total = libros.length;
        const disponibles = libros.filter(l => l.disponible).length;
        const prestados = total - disponibles;

        // Agrupar por género usando reduce
        const porGenero = libros.reduce((acc, libro) => {
            acc[libro.genero] = (acc[libro.genero] || 0) + 1;
            return acc;
        }, {});

        return { total, disponibles, prestados, porGenero };
    },

    // Historial de usuario con cálculo de multas   
    obtenerHistorialUsuario(userId) {
        const usuario = usuarios.find(u => u.id === userId);
        if (!usuario) return { mensaje: "Usuario no encontrado." };

        const { nombre, historial } = usuario; // Desestructuración del usuario
        //LIBRO= id, titulo, autor, genero, disponible, prestadoA, fechaPrestamo
        //USUARIO= id, nombre, historial [libroId, fechaPrestamo, fechaDevolucion]

        const historialDetallado = historial.map(registro => {
            //console.log("Registro válido: ", registro);

            const libroInfo = libros.find(l => l.id === registro.libroId) || { titulo: 'Desconocido' };
            const { titulo } = libroInfo; // Desestructuración del libroInfo

            let multaPendiente = 0;
            let estadoPrestamo = "Devuelto";

            if (registro.fechaDevolucion === null) {
                //console.log(registro.fechaPrestamo);
                // Si el libro no ha sido devuelto, calcular la posible multa actual
                const diasRetraso = calcularDiasDiferencia(registro.fechaPrestamo);
                multaPendiente = diasRetraso * MULTA_POR_DIA;
                estadoPrestamo = diasRetraso > 0 ? `Retraso (${diasRetraso} días)` : "Activo";
            }
            
            return {
                id: registro.libroId,
                titulo,
                estado: estadoPrestamo,
                fechaPrestamo: registro.fechaPrestamo,
                fechaDevolucion: registro.fechaDevolucion || 'Pendiente',
                multa: `$${multaPendiente.toFixed(2)}`
            };

        });

        return { nombre, historial: historialDetallado };
    }
};

/* ----------------------------------------------------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------------------------------------------------- */

// Demostraciones prácticas
console.log("📚 LIBROS:");
biblioteca.obtenerDisponibles().forEach(({ titulo, autor, disponible, prestadoA, fechaPrestamo }) => {
    console.log(`- "${titulo}" por ${autor}` + (disponible ? " (Disponible)" : ` (Prestado a ID: ${prestadoA} desde ${fechaPrestamo})`));
});


console.log("\n--- 🔎 BÚSQUEDA AVANZADA múltiples criterios (genero: 'Programación' y,  disponible: true---");
// Buscar libros de 'Programación' que estén 'disponibles'
const resultadosBusqueda = biblioteca.buscarAvanzada({
    genero: "Programación",
    disponible: true
});
console.log(`Encontrados ${resultadosBusqueda.length} libros de Programación disponibles:`);
resultadosBusqueda.forEach(({ titulo, autor }) => console.log(`- ${titulo} (${autor})`));




console.log("\n--- 🤝 OPERACIONES DE PRÉSTAMO Y MULTAS sobre 10 dias y con fecha Actual: 2025-11-25---");
// Préstamo (se presta el ID 4 al usuario 101)


console.log("\n--- PRÉSTAMO, ID:101, fecha prestamo: '2025-11-10-- 2025-11-20' libroId: (1,4)---");
console.log(biblioteca.prestar({ libroId: 4, userId: 101 , fecha: "2025-11-10"}).mensaje);
console.log(biblioteca.prestar({ libroId: 1, userId: 101 , fecha: "2025-11.20"}).mensaje);

console.log("\n--- PRÉSTAMO, ID:103, fecha prestamo: '2025-11-01' libroId: (3)---");
console.log(biblioteca.prestar({ libroId: 3, userId: 103 , fecha: "2025-11-01"}).mensaje);


console.log("\n 📚 LIBROS:");
biblioteca.obtenerDisponibles().forEach(({ titulo, autor, disponible, prestadoA, fechaPrestamo }) => {
    console.log(`- "${titulo}" por ${autor}` + (disponible ? " (Disponible)" : ` (Prestado a ID: ${prestadoA} desde ${fechaPrestamo})`));
});


console.log("\n--- 🧑‍💻 HISTORIAL Y MULTAS DE USUARIO, ID:101 ---");
// Historial de Alicia (ID 101)
const historial = biblioteca.obtenerHistorialUsuario(101);
console.log(`Historial de ${historial.nombre}:`);

historial.historial.forEach(({ id, titulo, estado, multa }) => { // Destructuring en forEach
    if(id > 0)
    console.log(`- ${titulo} | Estado: ${estado} | Multa Actual: ${multa}`);
});

// Devolución del libro ID 1 (prestado el 2025-11-01, con retraso)
const devolucion1 = biblioteca.devolver(1, "2025-12-10"); // Fecha de devolución con retraso
console.log(devolucion1.mensaje);


console.log("\n--- 🔥 REPORTE DE POPULARIDAD ---");
const popularidad = biblioteca.reportePopularidad();
popularidad.forEach(({ titulo, prestamos, genero }) => { // Destructuring en forEach
    console.log(`"${titulo}" | Genero: ${genero} | Préstamos: ${prestamos}`);
});


console.log("\n📊 ESTADÍSTICAS:");
const stats = biblioteca.obtenerEstadisticas();
console.log(`Total de libros: ${stats.total}`);
console.log(`Disponibles: ${stats.disponibles}`);
console.log(`Prestados: ${stats.prestados}`);
console.log("Por género:", stats.porGenero);
/* ----------------------------------------------------------------------------------------------------------------------- */