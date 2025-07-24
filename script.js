
let bajas = JSON.parse(localStorage.getItem("bajas")) || [];
let altas = JSON.parse(localStorage.getItem("altas")) || [];

function agruparPor(lista, campo) {
    return lista.reduce((acc, item) => {
        const key = item[campo];
        acc[key] = (acc[key] || 0) + Number(item.cantidad);
        return acc;
    }, {});
}

function calcularTotales() {
    const porPileta = {};

    altas.forEach(a => {
        const key = a.pileta;
        porPileta[key] = (porPileta[key] || 0) + Number(a.cantidad);
    });

    bajas.forEach(b => {
        const key = b.pileta;
        porPileta[key] = (porPileta[key] || 0) - Number(b.cantidad);
    });

    return porPileta;
}

function renderDashboard() {
    const totalPorPileta = calcularTotales();
    const mortalidadPorPileta = agruparPor(bajas, "pileta");
    const mortalidadPorDia = agruparPor(bajas, "fecha");

    document.getElementById("mortalidad-pileta").innerHTML =
        Object.entries(mortalidadPorPileta)
            .map(([k, v]) => `Pileta ${k}: ${v}`)
            .join("<br>");

    document.getElementById("total-pileta").innerHTML =
        Object.entries(totalPorPileta)
            .map(([k, v]) => `Pileta ${k}: ${v}`)
            .join("<br>");

    document.getElementById("mortalidad-dia").innerHTML =
        Object.entries(mortalidadPorDia)
            .map(([k, v]) => `${k}: ${v}`)
            .join("<br>");

    const totalGeneral = Object.values(totalPorPileta).reduce((acc, v) => acc + v, 0);
    document.getElementById("total-general").innerText = totalGeneral;
}

function guardarDatos() {
    localStorage.setItem("bajas", JSON.stringify(bajas));
    localStorage.setItem("altas", JSON.stringify(altas));
}

document.getElementById("form-bajas").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    bajas.push(data);
    guardarDatos();
    e.target.reset();
    renderDashboard();
});

document.getElementById("form-altas").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    altas.push(data);
    guardarDatos();
    e.target.reset();
    renderDashboard();
});

renderDashboard(); // Inicial

function resetearDatos() {
    if (confirm("¿Estás segura de que querés borrar todos los datos?")) {
        localStorage.clear();
        bajas = [];
        altas = [];
        renderDashboard();
        alert("Datos reiniciados correctamente.");
    }
}

function descargarDatos() {
    const data = {
        altas: JSON.parse(localStorage.getItem("altas") || "[]"),
        bajas: JSON.parse(localStorage.getItem("bajas") || "[]")
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `registro-esturiones-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById("importar-json").addEventListener("change", function (event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.altas || !data.bajas) {
                alert("⚠️ El archivo no contiene datos válidos de 'altas' y 'bajas'.");
                return;
            }

            // Guardar en localStorage
            localStorage.setItem("altas", JSON.stringify(data.altas));
            localStorage.setItem("bajas", JSON.stringify(data.bajas));

            // Actualizar arrays en memoria
            altas = data.altas;
            bajas = data.bajas;

            renderDashboard();
            alert("✅ Datos restaurados correctamente.");
        } catch (error) {
            alert("❌ Error al leer el archivo JSON.");
        }
    };

    lector.readAsText(archivo);
});

function descargarCSV() {
    const data = {
        altas: JSON.parse(localStorage.getItem("altas") || "[]"),
        bajas: JSON.parse(localStorage.getItem("bajas") || "[]")
    };

    // Unimos ambas listas y agregamos una columna "tipo"
    const combinados = [
        ...data.altas.map(d => ({ ...d, tipo: "alta" })),
        ...data.bajas.map(d => ({ ...d, tipo: "baja" }))
    ];

    if (combinados.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    // Cabeceras del CSV
    const headers = Object.keys(combinados[0]);
    const csvRows = [
        headers.join(","), // línea de encabezados
        ...combinados.map(obj => headers.map(h => obj[h]).join(","))
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registro-esturiones.csv";
    a.click();
    URL.revokeObjectURL(url);
}
