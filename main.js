/**
 * 数据图件制作工具 — 主入口
 */

import { parseFile } from './data-parser.js';
import { buildChartOption } from './chart-renderer.js';
import { exportPNG, exportSVG } from './exporter.js';

// ==================== 全局状态 ====================
const state = {
    data: null,
    chartType: 'line',
    chartInstance: null,
    settings: {
        title: '',
        titleFontSize: 14,
        fontFamily: 'Arial',
        axisFontSize: 12,
        axisNameFontSize: 14,
        xAxisName: '',
        yAxisName: '',
        xColumn: 0,
        yColumns: [],
        labelColumn: 0,
        valueColumn: 1,
        colorScheme: 'nature',
        showLegend: true,
        showGrid: false,
        smooth: false,
        showDataLabel: false
    }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initFileUpload();
    initChartTypeSelector();
    initStyleControls();
    initExportButtons();
    initPanelToggles();
    initDataManagement();
    setStatus('就绪 — 请上传数据文件');
});

// ==================== 数据管理 ====================
function initDataManagement() {
    const transposeBtn = document.getElementById('transposeDataBtn');
    if (transposeBtn) {
        transposeBtn.addEventListener('click', () => {
            if (!state.data) return;
            transposeData();
        });
    }
}

function transposeData() {
    const headers = state.data.headers;
    const rows = state.data.rows;

    if (!rows || rows.length === 0) return;

    // 创建矩阵：[表头, ...数据行]
    const matrix = [headers, ...rows];

    // 转置矩阵
    // 注意：假设所有行长度一致，以表头长度为准
    const newMatrix = headers.map((_, colIndex) => matrix.map(row => row[colIndex]));

    // 更新状态
    state.data.headers = newMatrix[0];
    state.data.rows = newMatrix.slice(1);

    // 重新渲染
    renderDataPreview();
    updateColumnSelects();
    renderChart();
    setStatus('数据已转置');
}

// ==================== 主题切换 ====================
function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('chart-tool-theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        btn.textContent = '☀️';
    }
    btn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
        btn.textContent = isLight ? '🌙' : '☀️';
        localStorage.setItem('chart-tool-theme', isLight ? 'dark' : 'light');
        if (state.data) renderChart();
    });
}

// ==================== 面板折叠 ====================
function initPanelToggles() {
    document.querySelectorAll('.panel-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const panelId = btn.getAttribute('data-panel');
            const content = document.getElementById(panelId);
            if (content) {
                content.classList.toggle('hidden');
                btn.classList.toggle('collapsed');
            }
        });
    });
}

// ==================== 文件上传 ====================
function initFileUpload() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('fileInput');
    const clearBtn = document.getElementById('clearFile');

    // 点击上传
    zone.addEventListener('click', () => input.click());

    // 文件选择
    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    // 拖拽
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    // 清除文件
    clearBtn.addEventListener('click', () => {
        state.data = null;
        input.value = '';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('uploadZone').style.display = '';
        hidePanels();
        showPlaceholder(true);
        setStatus('就绪 — 请上传数据文件');
        document.getElementById('dataInfo').textContent = '';
    });
}

async function handleFile(file) {
    setStatus(`正在解析: ${file.name} ...`);
    try {
        state.data = await parseFile(file);

        // 显示文件信息
        document.getElementById('fileName').textContent = `📄 ${file.name}`;
        document.getElementById('fileInfo').style.display = 'flex';
        document.getElementById('uploadZone').style.display = 'none';
        document.getElementById('dataInfo').textContent =
            `${state.data.headers.length} 列 × ${state.data.rows.length} 行`;

        // 数据预览
        renderDataPreview();

        // 填充数据映射选择器
        populateDataMappings();

        // 显示所有面板
        showPanels();
        showPlaceholder(false);

        // 自动渲染
        renderChart();
        setStatus(`已加载: ${file.name}`);
    } catch (err) {
        setStatus(`❌ ${err.message}`);
        console.error(err);
    }
}

// ==================== 数据预览 ====================
function renderDataPreview() {
    const container = document.getElementById('dataPreview');
    const maxRows = 20;
    const rows = state.data.rows.slice(0, maxRows);

    let html = '<table class="data-table"><thead><tr>';
    state.data.headers.forEach(h => {
        html += `<th>${escapeHtml(String(h))}</th>`;
    });
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
        html += '<tr>';
        state.data.headers.forEach((_, i) => {
            const val = row[i] ?? '';
            html += `<td>${escapeHtml(String(val))}</td>`;
        });
        html += '</tr>';
    });

    if (state.data.rows.length > maxRows) {
        html += `<tr><td colspan="${state.data.headers.length}" style="text-align:center;color:var(--text-muted)">... 共 ${state.data.rows.length} 行数据</td></tr>`;
    }

    html += '</tbody></table>';
    container.innerHTML = html;
}

// ==================== 数据映射 ====================
function populateDataMappings() {
    const headers = state.data.headers;
    const xSelect = document.getElementById('xColumn');
    const yContainer = document.getElementById('yColumns');
    const valueSelect = document.getElementById('valueColumn');
    const labelSelect = document.getElementById('labelColumn');

    // X 轴选择
    xSelect.innerHTML = headers.map((h, i) =>
        `<option value="${i}">${escapeHtml(h)}</option>`
    ).join('');
    state.settings.xColumn = 0;

    // Y 轴多选
    yContainer.innerHTML = headers.map((h, i) => {
        const checked = i === 1 ? 'checked' : '';
        return `<label class="checkbox-item">
      <input type="checkbox" value="${i}" ${checked}>
      <label>${escapeHtml(h)}</label>
    </label>`;
    }).join('');
    state.settings.yColumns = headers.length > 1 ? [1] : [];

    // 数值列（饼图用）
    valueSelect.innerHTML = headers.map((h, i) =>
        `<option value="${i}" ${i === 1 ? 'selected' : ''}>${escapeHtml(h)}</option>`
    ).join('');
    state.settings.valueColumn = 1;

    // 标签列（饼图用）
    labelSelect.innerHTML = headers.map((h, i) =>
        `<option value="${i}">${escapeHtml(h)}</option>`
    ).join('');
    state.settings.labelColumn = 0;

    // 事件
    xSelect.addEventListener('change', (e) => {
        state.settings.xColumn = Number(e.target.value);
        renderChart();
    });

    yContainer.addEventListener('change', () => {
        const checked = yContainer.querySelectorAll('input:checked');
        state.settings.yColumns = Array.from(checked).map(cb => Number(cb.value));
        renderChart();
    });

    valueSelect.addEventListener('change', (e) => {
        state.settings.valueColumn = Number(e.target.value);
        renderChart();
    });

    labelSelect.addEventListener('change', (e) => {
        state.settings.labelColumn = Number(e.target.value);
        renderChart();
    });

    updateMappingVisibility();
}

function updateMappingVisibility() {
    const isPie = state.chartType === 'pie';
    document.getElementById('yColumnGroup').style.display = isPie ? 'none' : '';
    document.getElementById('valueColumnGroup').style.display = isPie ? '' : 'none';
    document.getElementById('labelColumnGroup').style.display = isPie ? '' : 'none';

    const hasAxis = !['pie'].includes(state.chartType);
    document.getElementById('xAxisNameGroup').style.display = hasAxis ? '' : 'none';
    document.getElementById('yAxisNameGroup').style.display = hasAxis ? '' : 'none';
}

// ==================== 图表类型选择 ====================
function initChartTypeSelector() {
    const grid = document.getElementById('chartTypeGrid');
    grid.addEventListener('click', (e) => {
        const card = e.target.closest('.chart-type-card');
        if (!card) return;

        grid.querySelectorAll('.chart-type-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.chartType = card.getAttribute('data-type');

        updateMappingVisibility();
        if (state.data) renderChart();
    });
}

// ==================== 样式控件 ====================
function initStyleControls() {
    // 标题
    const titleInput = document.getElementById('chartTitle');
    titleInput.addEventListener('input', debounce(() => {
        state.settings.title = titleInput.value;
        renderChart();
    }, 300));

    // 字体选择
    const fontSelect = document.getElementById('fontFamily');
    fontSelect.addEventListener('change', () => {
        state.settings.fontFamily = fontSelect.value;
        renderChart();
    });

    // 标题字号
    const fontSize = document.getElementById('titleFontSize');
    const fontSizeValue = document.getElementById('titleFontSizeValue');
    fontSize.addEventListener('input', () => {
        state.settings.titleFontSize = Number(fontSize.value);
        fontSizeValue.textContent = `${fontSize.value}px`;
        renderChart();
    });

    // X 轴名称
    const xName = document.getElementById('xAxisName');
    xName.addEventListener('input', debounce(() => {
        state.settings.xAxisName = xName.value;
        renderChart();
    }, 300));

    // Y 轴名称
    const yName = document.getElementById('yAxisName');
    yName.addEventListener('input', debounce(() => {
        state.settings.yAxisName = yName.value;
        renderChart();
    }, 300));

    // 坐标轴字号
    const axisFontSize = document.getElementById('axisFontSize');
    const axisFontSizeValue = document.getElementById('axisFontSizeValue');
    axisFontSize.addEventListener('input', () => {
        state.settings.axisFontSize = Number(axisFontSize.value);
        axisFontSizeValue.textContent = `${axisFontSize.value}px`;
        renderChart();
    });

    // 轴名称字号
    const axisNameFontSize = document.getElementById('axisNameFontSize');
    const axisNameFontSizeValue = document.getElementById('axisNameFontSizeValue');
    axisNameFontSize.addEventListener('input', () => {
        state.settings.axisNameFontSize = Number(axisNameFontSize.value);
        axisNameFontSizeValue.textContent = `${axisNameFontSize.value}px`;
        renderChart();
    });

    // 配色方案
    const colorGrid = document.getElementById('colorSchemeGrid');
    colorGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.color-scheme-btn');
        if (!btn) return;
        colorGrid.querySelectorAll('.color-scheme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.settings.colorScheme = btn.getAttribute('data-scheme');
        renderChart();
    });

    // 开关
    document.getElementById('showLegend').addEventListener('change', (e) => {
        state.settings.showLegend = e.target.checked;
        renderChart();
    });
    document.getElementById('showGrid').addEventListener('change', (e) => {
        state.settings.showGrid = e.target.checked;
        renderChart();
    });
    document.getElementById('smoothLine').addEventListener('change', (e) => {
        state.settings.smooth = e.target.checked;
        renderChart();
    });
    document.getElementById('showDataLabel').addEventListener('change', (e) => {
        state.settings.showDataLabel = e.target.checked;
        renderChart();
    });
}

// ==================== 图表渲染 ====================
function renderChart() {
    if (!state.data) return;

    const container = document.getElementById('chart');

    // 初始化 / 获取 ECharts 实例
    if (!state.chartInstance) {
        state.chartInstance = echarts.init(container, null, { renderer: 'canvas' });
        window.addEventListener('resize', () => state.chartInstance?.resize());
    }

    try {
        const option = buildChartOption(state.chartType, state.data, state.settings);
        state.chartInstance.setOption(option, true);
    } catch (err) {
        console.error('图表渲染失败:', err);
        setStatus(`⚠️ 图表渲染失败: ${err.message}`);
    }
}

// ==================== 导出 ====================
function initExportButtons() {
    document.getElementById('exportPNG').addEventListener('click', () => {
        if (!state.chartInstance) return;
        exportPNG(state.chartInstance, state.settings.title);
        setStatus('✅ 已导出 PNG');
    });
    document.getElementById('exportSVG').addEventListener('click', () => {
        if (!state.chartInstance) return;
        exportSVG(state.chartInstance, state.settings.title);
        setStatus('✅ 已导出 SVG');
    });
}

// ==================== 工具函数 ====================
function showPanels() {
    ['previewPanel', 'chartTypePanel', 'dataMappingPanel', 'stylePanel', 'exportPanel'].forEach(id => {
        document.getElementById(id).style.display = '';
    });
}

function hidePanels() {
    ['previewPanel', 'chartTypePanel', 'dataMappingPanel', 'stylePanel', 'exportPanel'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    if (state.chartInstance) {
        state.chartInstance.dispose();
        state.chartInstance = null;
    }
}

function showPlaceholder(show) {
    document.getElementById('chartPlaceholder').style.display = show ? '' : 'none';
    document.getElementById('chartContainer').style.display = show ? 'none' : '';
}

function setStatus(text) {
    document.getElementById('statusText').textContent = text;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
