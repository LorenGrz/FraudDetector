let _dataLoaded = false;

async function initDashboard() {
    // Fast stats + charts load immediately, ML runs in background
    await Promise.all([loadFastStats(), loadDistribucion()]);
    loadMlContent(); // background, not awaited
}

// ---- Fast stats (DB counts only, no ML) ----
async function loadFastStats() {
    try {
        const res = await fetch(window.API_BASE + '/estadisticas/rapidas');
        if (!res.ok) throw new Error();
        const d = await res.json();
        document.getElementById('s-clientes').textContent = d.total_clientes.toLocaleString('es-AR');
        document.getElementById('s-transacciones').textContent = d.total_transacciones.toLocaleString('es-AR');
        document.getElementById('s-tpm').textContent = Math.round(d.promedio_transacciones_por_minuto);
    } catch {
        ['s-clientes', 's-transacciones', 's-tpm'].forEach(id => {
            document.getElementById(id).textContent = '—';
        });
    }
}

// ---- Charts (no ML) ----
async function loadDistribucion() {
    try {
        const res = await fetch(window.API_BASE + '/estadisticas/distribucion_montos');
        if (!res.ok) throw new Error();
        const { montos } = await res.json();

        // Histogram
        Plotly.newPlot('chart-hist', [{
            x: montos, type: 'histogram', nbinsx: 40,
            marker: { color: '#3b82f6', opacity: 0.85 },
        }], {
            margin: { t: 8, r: 8, b: 40, l: 48 },
            paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
            xaxis: { title: 'Monto ($)', gridcolor: '#f1f5f9', color: '#64748b', tickfont: { size: 10 } },
            yaxis: { title: 'Cantidad', gridcolor: '#f1f5f9', color: '#64748b', tickfont: { size: 10 } },
            showlegend: false, height: 250, dragmode: false,
        }, { displayModeBar: false, responsive: true, scrollZoom: false });

        // Donut by range
        const edges = [0, 1000, 5000, 10000, Infinity];
        const labels = ['< $1.000', '$1.000–$5.000', '$5.000–$10.000', '> $10.000'];
        const counts = [0, 0, 0, 0];
        for (const m of montos) {
            for (let i = 0; i < edges.length - 1; i++) {
                if (m >= edges[i] && m < edges[i + 1]) { counts[i]++; break; }
            }
        }
        Plotly.newPlot('chart-pie', [{
            labels, values: counts, type: 'pie', hole: 0.45,
            marker: { colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'] },
            textinfo: 'percent', textfont: { size: 11 },
        }], {
            margin: { t: 8, r: 8, b: 8, l: 8 },
            paper_bgcolor: 'transparent',
            legend: { orientation: 'v', font: { size: 10 }, x: 1.02, y: 0.5 },
            height: 250,
        }, { displayModeBar: false, responsive: true, scrollZoom: false });

    } catch {
        ['chart-hist', 'chart-pie'].forEach(id => {
            document.getElementById(id).innerHTML = '<p class="text-muted small p-3">Error al cargar gráfico.</p>';
        });
    }
}

// ---- ML content (slow: 3 models) ----
async function loadMlContent() {
    try {
        // Run both ML calls in parallel
        const [statsRes, scatterRes] = await Promise.all([
            fetch(window.API_BASE + '/estadisticas/'),
            fetch(window.API_BASE + '/anomalias/graficos/clientes_sospechosos?skip=0&limit=500'),
        ]);

        // Process stats
        if (statsRes.ok) {
            const d = await statsRes.json();
            const total = d.total_clientes || 1;
            const count = Math.round((d.porcentaje_clientes_sospechosos / 100) * total);

            document.getElementById('s-sospechosos').innerHTML =
                `${count} <small style="font-size:0.8rem;color:var(--red);">(${d.porcentaje_clientes_sospechosos}%)</small>`;
            document.getElementById('ml-count-mal').textContent = count;
            document.getElementById('ml-count-ok').textContent = (total - count).toLocaleString('es-AR');
            document.getElementById('ml-pct').textContent = d.porcentaje_clientes_sospechosos + '%';
            document.getElementById('ml-status').style.display = 'none';
            document.getElementById('ml-summary').style.display = 'block';
        }

        // Process scatter plot
        if (scatterRes.ok) {
            const html = await scatterRes.text();
            const container = document.getElementById('ml-scatter');
            container.innerHTML = html;
            for (const s of Array.from(container.querySelectorAll('script'))) {
                const tag = document.createElement('script');
                tag.text = s.textContent;
                if (s.src) tag.src = s.src;
                document.body.appendChild(tag);
            }
        }
    } catch {
        document.getElementById('ml-status').innerHTML =
            '<p class="text-muted small py-3">No se pudo cargar el análisis ML.</p>';
        document.getElementById('s-sospechosos').textContent = '—';
    }
}

// ---- Data tab (lazy) ----
async function loadDataTab() {
    if (_dataLoaded) return;
    _dataLoaded = true;

    try {
        const [txRes, clRes] = await Promise.all([
            fetch(window.API_BASE + '/transacciones/?skip=0&limit=25'),
            fetch(window.API_BASE + '/clientes/?skip=0&limit=25'),
        ]);
        const txs = await txRes.json();
        const cls = await clRes.json();

        const fmtId = id => `<code style="font-size:0.73rem;">${String(id).substring(0, 10)}…</code>`;
        const fmtMonto = m => '$' + Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2 });
        const fmtFecha = f => new Date(f).toLocaleDateString('es-AR');

        document.getElementById('datos-content').innerHTML = `
            <h6 class="fw-semibold mb-2" style="font-size:0.83rem;">
                Transacciones recientes
                <span class="badge bg-light text-secondary border ms-1" style="font-size:0.63rem;">primeras 25</span>
            </h6>
            <div class="table-responsive mb-4" style="max-height:320px;overflow-y:auto;">
                <table class="table data-table table-sm mb-0">
                    <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Cajero</th><th>Monto</th></tr></thead>
                    <tbody>
                        ${txs.map(t => `<tr>
                            <td>${fmtId(t.id)}</td>
                            <td>${fmtFecha(t.fecha_hora)}</td>
                            <td>${fmtId(t.id_cliente)}</td>
                            <td>${fmtId(t.id_cajero)}</td>
                            <td><strong>${fmtMonto(t.monto)}</strong></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <h6 class="fw-semibold mb-2" style="font-size:0.83rem;">
                Clientes
                <span class="badge bg-light text-secondary border ms-1" style="font-size:0.63rem;">primeros 25</span>
            </h6>
            <div class="table-responsive" style="max-height:320px;overflow-y:auto;">
                <table class="table data-table table-sm mb-0">
                    <thead><tr><th>ID</th><th>Nombre</th><th>Género</th><th>Ocupación</th><th>Tipo cuenta</th></tr></thead>
                    <tbody>
                        ${cls.map(c => `<tr>
                            <td>${fmtId(c.id)}</td>
                            <td>${c.nombre} ${c.apellido}</td>
                            <td>${c.genero}</td>
                            <td>${c.ocupacion}</td>
                            <td><span class="badge bg-light text-dark border" style="font-size:0.68rem;">${c.tipo_cuenta}</span></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch {
        document.getElementById('datos-content').innerHTML =
            '<p class="text-muted small p-3">Error al cargar los datos.</p>';
    }
}

// ---- Refresh ----
async function refreshAll() {
    const btn = document.getElementById('refresh-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-arrow-clockwise spin me-1"></i>Actualizando…';

    // Reset ML
    _dataLoaded = false;
    document.getElementById('s-sospechosos').innerHTML = '<span class="skel"></span>';
    document.getElementById('ml-status').innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-danger mb-2" role="status" style="width:1.5rem;height:1.5rem;"></div>
            <p class="text-muted small mb-0">Ejecutando modelos de detección de anomalías…</p>
        </div>`;
    document.getElementById('ml-status').style.display = 'block';
    document.getElementById('ml-summary').style.display = 'none';
    document.getElementById('ml-scatter').innerHTML = '';
    document.getElementById('datos-content').innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-secondary mb-2" role="status" style="width:1.5rem;height:1.5rem;"></div>
            <p class="text-muted small mb-0">Cargando datos…</p>
        </div>`;

    await Promise.all([loadFastStats(), loadDistribucion()]);
    loadMlContent();

    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Actualizar';
}
