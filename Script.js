/**
 * Election Vote Count Analysis
 * 
 * Algorithms:
 * 1. Iterative: Standard for-loop summation. Time Complexity: O(n)
 * 2. Recursive: Divide and Conquer summation. Time Complexity: O(n) [with O(log n) stack depth]
 */


let chartInstance = null;

function generateVoteData(size, numCandidates) {
    return Array.from({ length: size }, () =>
        Array.from({ length: numCandidates }, () => Math.floor(Math.random() * 100) + 1)
    );
}



function sumIterative(data) {
    if (data.length === 0) return [];
    const numCandidates = data[0].length;

    const totals = new Array(numCandidates).fill(0);

    for (let i = 0; i < data.length; i++) {
        for (let c = 0; c < numCandidates; c++) {
            totals[c] += data[i][c];
        }
    }
    return totals;
}

function addVectors(v1, v2) {
    const res = new Array(v1.length);
    for (let i = 0; i < v1.length; i++) res[i] = v1[i] + v2[i];
    return res;
}

function sumRecursive(data, left, right) {

    if (left > right) return data[0].map(() => 0);

    if (left === right) return data[left];

    const mid = Math.floor((left + right) / 2);

    const leftRes = sumRecursive(data, left, mid);
    const rightRes = sumRecursive(data, mid + 1, right);

    return addVectors(leftRes, rightRes);
}

function runRecursive(data) {
    if (data.length === 0) return [];
    return sumRecursive(data, 0, data.length - 1);
}


function measureTime(callback) {
    const start = performance.now();
    const result = callback();
    const end = performance.now();
    return {
        result: result,
        time: (end - start)
    };
}


function toggleManualInputDisplay() {
    const type = document.getElementById('manualInputType').value;
    if (type === 'raw') {
        document.getElementById('manual-raw-container').classList.remove('hidden');
        document.getElementById('manual-generate-container').classList.add('hidden');
    } else {
        document.getElementById('manual-raw-container').classList.add('hidden');
        document.getElementById('manual-generate-container').classList.remove('hidden');
    }
}

async function runSimulation() {
    const runBtn = document.getElementById('runBtn');
    runBtn.disabled = true;
    runBtn.innerHTML = 'Memproses...';

    try {
        await runSingleSimulation();
    } catch (e) {
        alert("Error: " + e.message);
        console.error(e);
    } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = 'Jalankan Simulasi';
    }
}

async function runSingleSimulation() {
    const inputType = document.getElementById('manualInputType').value;
    let data = [];
    let size = 0;
    let numCandidates = 1;

    if (inputType === 'raw') {
        const rawText = document.getElementById('manualDataInput').value;
        if (!rawText.trim()) throw new Error("Mohon masukkan data angka.");

        numCandidates = parseInt(document.getElementById('manualCandidateCount').value) || 1;
        if (numCandidates < 1) throw new Error("Jumlah paslon minimal 1.");

        const lines = rawText.trim().split(/\n+/);
        data = lines.map((line, index) => {

            const parts = line.trim().split(/[\s,]+/);

            const votes = parts.map(s => parseInt(s)).filter(n => !isNaN(n));

            if (votes.length !== numCandidates) {
                throw new Error(`Data di baris ${index + 1} tidak valid. Harap masukkan ${numCandidates} angka.`);
            }
            return votes;
        });

        size = data.length;
        if (size === 0) throw new Error("Format data salah.");

    } else {
        size = parseInt(document.getElementById('customSizeInput').value);
        numCandidates = parseInt(document.getElementById('customCandidateInput').value);
        if (!size || size <= 0) throw new Error("Masukkan jumlah data yang valid.");
        if (!numCandidates || numCandidates <= 0) throw new Error("Jumlah paslon minimal 1.");

        if (size > 50000) if (!confirm("Ukuran data sangat besar. Lanjutkan?")) return;

        data = generateVoteData(size, numCandidates);
    }

    prepareResultsUI(false);

    await new Promise(resolve => setTimeout(resolve, 50));
    const res = processData(data, size);

    addResultRow(res);
    updateLiveStats(res);
    addChartPoint(res);
}

function processData(data, size) {
    const iterMetric = measureTime(() => sumIterative(data));
    const recurMetric = measureTime(() => runRecursive(data));

    return {
        size: size,
        iterTime: iterMetric.time,
        recurTime: recurMetric.time,
        iterResult: iterMetric.result,
        recurResult: recurMetric.result
    };
}


function prepareResultsUI(clearTable) {
    document.getElementById('statusMessage').classList.add('hidden');
    document.getElementById('statsContainer').classList.remove('hidden');
    document.getElementById('tableWrapper').classList.remove('hidden');

    if (clearTable) {
        document.getElementById('benchmarkTableBody').innerHTML = '';
    }
}

function addResultRow(res) {
    const tbody = document.getElementById('benchmarkTableBody');
    const row = `
        <tr>
            <td>${res.size.toLocaleString()}</td>
            <td>${res.iterTime.toFixed(4)}</td>
            <td>${res.recurTime.toFixed(4)}</td>
        </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', row);
}

function formatResultList(totals) {
    if (!totals || totals.length === 0) return '0';
    if (totals.length > 5) {
        return totals.slice(0, 3).map((t, i) => `P${i + 1}: ${t.toLocaleString()}`).join('<br>') + `<br>... (+${totals.length - 3})`;
    }
    return totals.map((t, i) => `Paslon ${i + 1}: <strong>${t.toLocaleString()}</strong>`).join('<br>');
}

function updateLiveStats(res) {
    document.getElementById('totalIterative').innerHTML = formatResultList(res.iterResult);
    document.getElementById('timeIterative').textContent = `${res.iterTime.toFixed(4)} ms (N=${res.size})`;

    document.getElementById('totalRecursive').innerHTML = formatResultList(res.recurResult);
    document.getElementById('timeRecursive').textContent = `${res.recurTime.toFixed(4)} ms (N=${res.size})`;
}


function getChartConfig() {
    return {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Iteratif',
                    data: [],
                    borderColor: '#818cf8',
                    backgroundColor: 'rgba(129, 140, 248, 0.2)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Rekursif',
                    data: [],
                    borderColor: '#c084fc',
                    backgroundColor: 'rgba(192, 132, 252, 0.2)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } },
                title: { display: true, text: 'Waktu Eksekusi (ms)', color: '#f8fafc' }
            },
            scales: {
                x: {
                    type: 'linear',
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: { display: true, text: 'Jumlah Data Input (N)', color: '#94a3b8' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: { display: true, text: 'Waktu (ms)', color: '#94a3b8' }
                }
            }
        }
    };
}

function updateChart(results, reset) {
    const ctx = document.getElementById('performanceChart').getContext('2d');

    if (chartInstance && reset) {
        chartInstance.destroy();
        chartInstance = null;
    }

    if (!chartInstance) {
        chartInstance = new Chart(ctx, getChartConfig());
    }

    if (reset) {
        const sorted = [...results].sort((a, b) => a.size - b.size);
        chartInstance.data.labels = sorted.map(r => r.size);
        chartInstance.data.datasets[0].data = sorted.map(r => ({ x: r.size, y: r.iterTime }));
        chartInstance.data.datasets[1].data = sorted.map(r => ({ x: r.size, y: r.recurTime }));
    }

    chartInstance.update();
}

function addChartPoint(res) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    if (!chartInstance) {
        chartInstance = new Chart(ctx, getChartConfig());
    }

    chartInstance.data.datasets[0].data.push({ x: res.size, y: res.iterTime });
    chartInstance.data.datasets[1].data.push({ x: res.size, y: res.recurTime });

    chartInstance.data.datasets[0].data.sort((a, b) => a.x - b.x);
    chartInstance.data.datasets[1].data.sort((a, b) => a.x - b.x);

    chartInstance.update();
}

function resetChart() {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    document.getElementById('benchmarkTableBody').innerHTML = '';
    document.getElementById('totalIterative').textContent = '-';
    document.getElementById('totalRecursive').textContent = '-';
}

document.getElementById('runBtn').addEventListener('click', runSimulation);

window.toggleManualInputDisplay = toggleManualInputDisplay;
window.resetChart = resetChart;
