let lanzamientos = []; // Registro de todos los resultados obtenidos
let frecuencias = {};  // Mapeo dinámico de frecuencias

let scene, camera, renderer, cube1, cube2;
let isSpinningFast = false;
let dosDadosActivos = false;
// Añade esta variable global al principio de tu archivo junto a las demás
let chartFrecuencias = null;
let chartAcumulada = null;

function actualizarTabla() {
    const total = lanzamientos.length;
    const cuerpo = document.getElementById('tabla-cuerpo');
    const tituloModal = document.getElementById('modal-titulo-dinamico');
    cuerpo.innerHTML = "";
    
    tituloModal.innerText = dosDadosActivos 
        ? "Estadísticas: Combinaciones de 2 Dados" 
        : "Estadísticas: Lanzamiento de 1 Dado";

    let acumuladaAbsoluta = 0;

    // Arreglos para alimentar las gráficas
    const labels = [];
    const datosAbsolutos = [];
    const datosRelativos = [];
    const datosAcumulados = [];

    Object.keys(frecuencias).forEach(key => {
        const f = frecuencias[key];
        const h_valor = total > 0 ? (f / total) : 0; // Valor numérico para la gráfica
        const h = total > 0 ? `${f}/${total}` : "0"; // Texto para la tabla
        
        acumuladaAbsoluta += f; 
        const H_valor = total > 0 ? (acumuladaAbsoluta / total) : 0; // Valor numérico para la gráfica
        const H = total > 0 ? `${acumuladaAbsoluta}/${total}` : "0"; // Texto para la tabla

        // Insertar fila en la tabla
        const fila = `<tr>
            <td><strong>${key}</strong></td>
            <td>${f}</td>
            <td>${h}</td>
            <td>${H}</td>
        </tr>`;
        cuerpo.innerHTML += fila;

        // Guardar datos para las gráficas
        labels.push(key);
        datosAbsolutos.push(f);
        datosRelativos.push(h_valor * 100); // Se guarda como porcentaje para facilitar la lectura
        datosAcumulados.push(H_valor * 100);
    });

    document.getElementById('total-lanzamientos').innerText = `Total de lanzamientos: ${total}`;

    // --- RENDERIZADO DE LAS GRÁFICAS ---
    renderizarGraficas(labels, datosAbsolutos, datosRelativos, datosAcumulados);
}

function renderizarGraficas(labels, absolutos, relativos, acumulados) {
    // Destruir gráficos anteriores si existen para evitar duplicados al sobreescribir
    if (chartFrecuencias) chartFrecuencias.destroy();
    if (chartAcumulada) chartAcumulada.destroy();

    const ctxFrec = document.getElementById('graficoFrecuencias').getContext('2d');
    const ctxAcum = document.getElementById('graficoAcumulada').getContext('2d');

    // Estilos compartidos oscuros para hacer match con tu fondo 0x121212
    const gridColor = 'rgba(255, 255, 255, 0.1)';
    const textColor = '#e0e0e0';

    // 1. Gráfico de Frecuencias Absolutas y Relativas
    chartFrecuencias = new Chart(ctxFrec, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Frecuencia Absoluta (f)',
                    data: absolutos,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'yAbs',
                },
                {
                    label: 'Frecuencia Relativa (%)',
                    data: relativos,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    yAxisID: 'yRel',
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: textColor } },
                title: { display: true, text: 'Distribución de Frecuencias', color: textColor, font: { size: 16 } }
            },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor } },
                yAbs: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Cantidad de veces', color: textColor },
                    grid: { color: gridColor },
                    ticks: { color: textColor, stepSize: 1 }
                },
                yRel: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Porcentaje (%)', color: textColor },
                    grid: { drawOnChartArea: false }, // No duplicar líneas de cuadrícula
                    ticks: { 
                        color: textColor,
                        callback: value => value + '%'
                    },
                    min: 0,
                    max: 100
                }
            }
        }
    });

    // 2. Gráfico de Frecuencia Acumulada (Ojiva)
    chartAcumulada = new Chart(ctxAcum, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frecuencia Acumulada (H) %',
                data: acumulados,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.1,
                borderWidth: 2,
                pointBackgroundColor: 'rgba(255, 99, 132, 1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: textColor } },
                title: { display: true, text: 'Frecuencia Relativa Acumulada', color: textColor, font: { size: 16 } }
            },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor } },
                y: {
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor,
                        callback: value => value + '%'
                    },
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

// --- MOTOR 3D ---
function crearTexturaDado(numero) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'black';
    const p = 64, m = 128, d = 192;
    const puntos = {
        1: [[m, m]], 2: [[p, p], [d, d]], 3: [[p, p], [m, m], [d, d]],
        4: [[p, p], [d, p], [p, d], [d, d]], 5: [[p, p], [d, p], [m, m], [p, d], [d, d]],
        6: [[p, p], [d, p], [p, m], [d, m], [p, d], [d, d]]
    };
    puntos[numero].forEach(pos => {
        ctx.beginPath(); ctx.arc(pos[0], pos[1], 25, 0, Math.PI * 2); ctx.fill();
    });
    return new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas) });
}

function init() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4.5;
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const materiales = [crearTexturaDado(1), crearTexturaDado(2), crearTexturaDado(3), 
                        crearTexturaDado(4), crearTexturaDado(5), crearTexturaDado(6)];
    
    cube1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), materiales);
    scene.add(cube1);

    cube2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), materiales);
    scene.add(cube2);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    configurarModoEstructural();
    
    const toggleSwitch = document.getElementById('dice-toggle');
    toggleSwitch.addEventListener('change', evaluarCambioModo);

    animate();
}2

function evaluarCambioModo() {
    const toggleSwitch = document.getElementById('dice-toggle');
    const statusLabel = document.getElementById('status-label');
    const displayHeader = document.getElementById('display-header');

    dosDadosActivos = toggleSwitch.checked;
    if (dosDadosActivos) {
        toggleSwitch.classList.add('active-two-dice');
        toggleSwitch.classList.remove('active-one-die');
        statusLabel.textContent = "DOS DADOS";
        displayHeader.textContent = "Resultado Par";
    } else {
        toggleSwitch.classList.add('active-one-die');
        toggleSwitch.classList.remove('active-two-dice');
        statusLabel.textContent = "UN DADO";
        displayHeader.textContent = "Resultado";
    }
    
    configurarModoEstructural();
    document.getElementById('resultado-display').innerText = "-";
}

function configurarModoEstructural() {
    lanzamientos = [];
    frecuencias = {};
    
    if (!dosDadosActivos) {
        for (let i = 1; i <= 6; i++) frecuencias[i] = 0;
        if(cube1 && cube2) {
            cube1.position.set(0, 0, 0);
            cube2.visible = false;
        }
    } else {
        // Inicializar las 36 combinaciones como llaves de texto "(d1,d2)"
        for (let i = 1; i <= 6; i++) {
            for (let j = 1; j <= 6; j++) {
                frecuencias[`(${i},${j})`] = 0;
            }
        }
        if(cube1 && cube2) {
            cube1.position.set(-1.1, 0, 0);
            cube2.position.set(1.1, 0, 0);
            cube2.visible = true;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    const speed = isSpinningFast ? 0.4 : 0.01;
    if (cube1) { cube1.rotation.x += speed; cube1.rotation.y += speed; }
    if (cube2 && cube2.visible) { cube2.rotation.x += speed; cube2.rotation.y += speed; }
    renderer.render(scene, camera);
}

// --- LÓGICA DE DATOS ---

function lanzarDado() {
    configurarModoEstructural();
    document.getElementById('resultado-display').innerText = "🎲";
    isSpinningFast = true;

    let resultadoKey = "";
    let valorDisplay = "";

    if (!dosDadosActivos) {
        const d1 = Math.floor(Math.random() * 6) + 1;
        resultadoKey = d1;
        valorDisplay = d1;
    } else {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        resultadoKey = `(${d1},${d2})`;
        valorDisplay = resultadoKey; 
    }
    
    lanzamientos.push(resultadoKey);
    frecuencias[resultadoKey]++;
    
    setTimeout(() => {
        isSpinningFast = false;
        document.getElementById('resultado-display').innerText = valorDisplay;
        actualizarTabla();
    }, 600);
}


function exportarExcel() {
    const datosExcel = [];
    let acumuladaAbsoluta = 0;
    const total = lanzamientos.length;

    Object.keys(frecuencias).forEach(key => {
        const f = frecuencias[key];
        const h = total > 0 ? `${f}/${total}` : "0";
        
        acumuladaAbsoluta += f;
        const H = total > 0 ? `${acumuladaAbsoluta}/${total}` : "0";

        datosExcel.push({
            "Resultado (x)": key,
            "Frecuencia (f)": f,
            "Frecuencia Relativa (h)": h,
            "Frec. Acumulada (H)": H
        });
    });

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    const nombreHoja = dosDadosActivos ? "Combinaciones 2 Dados" : "1 Dado";
    const nombreArchivo = dosDadosActivos ? "Estadisticas_Combinaciones.xlsx" : "Estadisticas_1_Dado.xlsx";
    
    XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);
    XLSX.writeFile(workbook, nombreArchivo);
}
// Función para ejecutar lanzamientos consecutivos
function lanzarMultiple() {
    const input = document.getElementById('multiplicador-input');
    // Validamos el rango entre 1 y 150
    let cantidad = Math.min(Math.max(parseInt(input.value) || 1, 1), 150);
    input.value = cantidad; // Refleja la corrección en el textbox si el usuario puso más de 150
    configurarModoEstructural();
    isSpinningFast = true;

    for (let i = 0; i < cantidad; i++) {
        let resKey;
        if (!dosDadosActivos) {
            resKey = Math.floor(Math.random() * 6) + 1;
        } else {
            // Genera el par (d1, d2) para las 36 combinaciones
            resKey = `(${Math.floor(Math.random() * 6) + 1},${Math.floor(Math.random() * 6) + 1})`;
        }
        
        lanzamientos.push(resKey);
        frecuencias[resKey]++;

        // Al terminar el bucle, detenemos la animación y mostramos el último resultado
        if (i === cantidad - 1) {
            setTimeout(() => {
                isSpinningFast = false;
                document.getElementById('resultado-display').innerText = resKey;
                actualizarTabla();
            }, 600);
        }
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('DOMContentLoaded', init);
