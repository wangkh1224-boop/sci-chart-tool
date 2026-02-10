/**
 * 图表渲染模块
 * SCI 论文标准风格 — 参考图样式（带数据标签、大标记点、4:3 比例）
 */

import { colorSchemes, getBaseThemeOption } from './theme.js';

/**
 * 生成完整的 ECharts option
 */
export function buildChartOption(type, data, settings) {
    const base = getBaseThemeOption(settings);
    const colors = colorSchemes[settings.colorScheme || 'nature'].colors;
    const fontFamily = `'${settings.fontFamily || 'Arial'}', 'Noto Sans SC', Helvetica, sans-serif`;

    const option = {
        ...base,
        color: colors,
        animationDuration: 500,
        animationEasing: 'cubicOut'
    };

    // 标题
    if (settings.title) {
        option.title = {
            ...base.title,
            text: settings.title,
            textStyle: {
                ...base.title.textStyle,
                fontSize: settings.titleFontSize || 14
            },
            left: 'center',
            top: 8
        };
    }

    // 工具箱
    option.toolbox = {
        ...base.toolbox,
        feature: {
            saveAsImage: { title: '保存', pixelRatio: 3 },
            dataZoom: { title: { zoom: '缩放', back: '还原' } },
            restore: { title: '还原' }
        },
        right: 12,
        top: 4,
        itemSize: 13
    };

    switch (type) {
        case 'line':
            return buildLineOption(option, data, settings, base, fontFamily, colors);
        case 'bar':
            return buildBarOption(option, data, settings, base, fontFamily, colors);
        case 'scatter':
            return buildScatterOption(option, data, settings, base, fontFamily, colors);
        case 'pie':
            return buildPieOption(option, data, settings, base, fontFamily, colors);
        case 'heatmap':
            return buildHeatmapOption(option, data, settings, base, fontFamily, colors);
        case 'boxplot':
            return buildBoxplotOption(option, data, settings, base, fontFamily, colors);
        default:
            return buildLineOption(option, data, settings, base, fontFamily, colors);
    }
}

/**
 * SCI 四面封闭框
 * 通过添加镜像坐标轴实现，为了保证刻度完全对齐，
 * 需要将数据映射到镜像轴上（使用透明系列）。
 */
function addBoxFrame(option) {
    if (!Array.isArray(option.xAxis)) option.xAxis = [option.xAxis];
    if (!Array.isArray(option.yAxis)) option.yAxis = [option.yAxis];
    const primaryX = option.xAxis[0];
    const primaryY = option.yAxis[0];

    // 1. 顶部 X 轴
    const topXAxis = {
        ...primaryX,
        position: 'top',
        name: undefined, // 不显示标题
        axisLabel: { show: false }, // 不显示标签
        splitLine: { show: false }, // 不显示网格
        data: primaryX.data, // 复制类目数据（如果是 category）
        axisLine: { show: true, lineStyle: { color: '#000', width: 1.5 }, onZero: false },
        axisTick: { show: false }, // 移除顶部刻度
        minorTick: { show: false } // 移除顶部次刻度
    };
    option.xAxis.push(topXAxis);

    // 2. 右侧 Y 轴
    const rightYAxis = {
        ...primaryY,
        position: 'right',
        name: undefined,
        axisLabel: { show: false },
        splitLine: { show: false },
        axisLine: { show: true, lineStyle: { color: '#000', width: 1.5 }, onZero: false },
        axisTick: { show: false }, // 移除右侧刻度
        minorTick: { show: false } // 移除右侧次刻度
    };
    option.yAxis.push(rightYAxis);

    // 3. 添加透明系列以撑开镜像轴的刻度
    // 必须复制所有系列，否则多系列堆叠或不同量级时刻度会错
    // 为了性能，只复制第一个系列的数据结构即可？
    // 不，如果为了精确对齐，最好与主轴一致。
    // 简单起见，我们将所有 series 复制一份，设为透明，并指定 xAxisIndex: 1, yAxisIndex: 1
    const phantomSeries = option.series.map(s => ({
        ...s,
        name: s.name + '_phantom',
        xAxisIndex: 1,
        yAxisIndex: 1,
        showSymbol: false, // 隐藏标记
        symbolSize: 0,
        lineStyle: { opacity: 0, width: 0 }, // 隐藏线
        itemStyle: { opacity: 0 }, // 隐藏项
        areaStyle: { opacity: 0 }, // 隐藏区域（如果有）
        label: { show: false }, // 隐藏标签
        tooltip: { show: false }, // 隐藏提示框
        emphasis: { disabled: true } // 禁用高亮
    }));

    option.series.push(...phantomSeries);

    return option;
}

/**
 * 生成带颜色边框的数据标签配置（参考图样式）
 */
function makeDataLabel(settings, fontFamily, color) {
    if (!settings.showDataLabel) {
        return { show: false };
    }
    return {
        show: true,
        fontFamily: fontFamily,
        fontSize: settings.axisFontSize || 12,
        fontWeight: 'bold',
        color: color || '#000',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderColor: color || '#999',
        borderWidth: 1,
        borderRadius: 3,
        padding: [3, 6],
        position: 'top',
        distance: 8
    };
}

/* ======================== 折线图 ======================== */
function buildLineOption(option, data, settings, base, fontFamily, colors) {
    const { xData, series } = extractXYData(data, settings);

    // 计算 Grid 顶部位置
    const gridTop = settings.title ? 55 : 40;

    // 不同系列使用不同的标记形状（参考图：circle, square, diamond 等）
    const symbols = ['circle', 'rect', 'triangle', 'diamond', 'pin', 'arrow'];

    option.tooltip = { ...base.tooltip, trigger: 'axis' };
    option.legend = settings.showLegend && series.length > 1 ? {
        ...base.legend,
        data: series.map(s => s.name),
        top: gridTop + 8,
        left: 85,
        orient: 'vertical',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        padding: [8, 12],
        icon: 'roundRect'
    } : undefined;
    option.grid = {
        ...base.grid,
        top: gridTop,
        bottom: 60
    };
    option.xAxis = {
        ...base.xAxis,
        type: 'category',
        data: xData,
        name: settings.xAxisName || '',
        boundaryGap: false,
        splitLine: {
            show: settings.showGrid,
            lineStyle: { color: 'rgba(0,0,0,0.1)', type: 'dashed', width: 0.8 }
        }
    };
    option.yAxis = {
        ...base.yAxis,
        type: 'value',
        name: settings.yAxisName || '',
        splitLine: {
            show: settings.showGrid,
            lineStyle: { color: 'rgba(0,0,0,0.1)', type: 'dashed', width: 0.8 }
        }
    };
    option.series = series.map((s, i) => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: settings.smooth || false,
        symbol: symbols[i % symbols.length],
        symbolSize: 8,
        lineStyle: { width: 2.5 },
        label: makeDataLabel(settings, fontFamily, colors[i % colors.length]),
        emphasis: {
            scale: true,
            symbolSize: 12
        }
    }));

    return addBoxFrame(option);
}

/* ======================== 柱状图 ======================== */
function buildBarOption(option, data, settings, base, fontFamily, colors) {
    const { xData, series } = extractXYData(data, settings);

    const gridTop = settings.title ? 55 : 40;

    option.tooltip = { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } };
    option.legend = settings.showLegend && series.length > 1 ? {
        ...base.legend,
        data: series.map(s => s.name),
        top: gridTop + 8,
        left: 85,
        orient: 'vertical',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        padding: [8, 12]
    } : undefined;
    option.grid = {
        ...base.grid,
        top: gridTop,
        bottom: 60
    };
    option.xAxis = {
        ...base.xAxis,
        type: 'category',
        data: xData,
        name: settings.xAxisName || ''
    };
    option.yAxis = {
        ...base.yAxis,
        type: 'value',
        name: settings.yAxisName || '',
        splitLine: {
            show: settings.showGrid,
            lineStyle: { color: 'rgba(0,0,0,0.1)', type: 'dashed', width: 0.8 }
        }
    };
    option.series = series.map((s, i) => ({
        name: s.name,
        type: 'bar',
        data: s.data,
        barMaxWidth: 40,
        itemStyle: {
            borderColor: '#000',
            borderWidth: 0.5
        },
        label: settings.showDataLabel ? {
            show: true,
            position: 'top',
            fontFamily: fontFamily,
            fontSize: settings.axisFontSize || 12,
            fontWeight: 'bold',
            color: '#000'
        } : { show: false },
        emphasis: {
            itemStyle: { shadowBlur: 4, shadowColor: 'rgba(0,0,0,0.2)' }
        }
    }));

    return addBoxFrame(option);
}

/* ======================== 散点图 ======================== */
function buildScatterOption(option, data, settings, base, fontFamily, colors) {
    const { xData, series } = extractXYData(data, settings);
    const symbols = ['circle', 'rect', 'triangle', 'diamond'];

    const gridTop = settings.title ? 55 : 40;

    option.tooltip = { ...base.tooltip, trigger: 'item' };
    option.legend = settings.showLegend && series.length > 1 ? {
        ...base.legend,
        data: series.map(s => s.name),
        top: gridTop + 8,
        left: 85,
        orient: 'vertical',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        padding: [8, 12]
    } : undefined;
    option.grid = {
        ...base.grid,
        top: gridTop,
        bottom: 60
    };
    option.xAxis = {
        ...base.xAxis,
        type: isNumericArray(xData) ? 'value' : 'category',
        data: isNumericArray(xData) ? undefined : xData,
        name: settings.xAxisName || '',
        splitLine: {
            show: settings.showGrid,
            lineStyle: { color: 'rgba(0,0,0,0.1)', type: 'dashed', width: 0.8 }
        }
    };
    option.yAxis = {
        ...base.yAxis,
        type: 'value',
        name: settings.yAxisName || '',
        splitLine: {
            show: settings.showGrid,
            lineStyle: { color: 'rgba(0,0,0,0.1)', type: 'dashed', width: 0.8 }
        }
    };
    option.series = series.map((s, i) => ({
        name: s.name,
        type: 'scatter',
        data: isNumericArray(xData)
            ? xData.map((x, j) => [x, s.data[j]])
            : s.data,
        symbol: symbols[i % symbols.length],
        symbolSize: 9,
        itemStyle: {
            borderColor: '#000',
            borderWidth: 0.5
        },
        label: makeDataLabel(settings, fontFamily, colors[i % colors.length]),
        emphasis: {
            scale: 1.3
        }
    }));

    return addBoxFrame(option);
}

/* ======================== 饼图 ======================== */
function buildPieOption(option, data, settings, base, fontFamily, colors) {
    const labelCol = settings.labelColumn ?? settings.xColumn ?? 0;
    const valueCol = settings.valueColumn ?? (settings.yColumns?.[0] ?? 1);
    const labelIdx = typeof labelCol === 'number' ? labelCol : data.headers.indexOf(labelCol);
    const valueIdx = typeof valueCol === 'number' ? valueCol : data.headers.indexOf(valueCol);

    const pieData = data.rows.map(row => ({
        name: String(row[labelIdx] || ''),
        value: toNumber(row[valueIdx])
    })).filter(d => d.value > 0);

    option.tooltip = { ...base.tooltip, trigger: 'item', formatter: '{b}: {c} ({d}%)' };
    option.legend = settings.showLegend ? {
        ...base.legend,
        orient: 'vertical',
        right: 20,
        top: 'center',
        data: pieData.map(d => d.name)
    } : undefined;
    option.series = [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: settings.showLegend ? ['40%', '55%'] : ['50%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: {
            show: true,
            fontSize: settings.axisFontSize || 12,
            fontFamily: fontFamily,
            color: '#000',
            formatter: settings.showDataLabel ? '{b}\n{c} ({d}%)' : '{b}\n{d}%'
        },
        emphasis: {
            label: { fontSize: (settings.axisFontSize || 12) + 2, fontWeight: 'bold' }
        },
        data: pieData
    }];

    return option;
}

/* ======================== 热力图 ======================== */
function buildHeatmapOption(option, data, settings, base, fontFamily, colors) {
    const xCol = settings.xColumn ?? 0;
    const yColIdx = settings.yColumns?.[0] ?? 1;
    const valColIdx = settings.yColumns?.[1] ?? 2;

    const xIdx = typeof xCol === 'number' ? xCol : data.headers.indexOf(xCol);
    const yIdx = typeof yColIdx === 'number' ? yColIdx : data.headers.indexOf(yColIdx);
    const vIdx = typeof valColIdx === 'number' ? valColIdx : data.headers.indexOf(valColIdx);

    const xCategories = [...new Set(data.rows.map(r => String(r[xIdx])))];
    const yCategories = [...new Set(data.rows.map(r => String(r[yIdx])))];

    const heatmapData = data.rows.map(row => [
        xCategories.indexOf(String(row[xIdx])),
        yCategories.indexOf(String(row[yIdx])),
        toNumber(row[vIdx])
    ]);

    const values = heatmapData.map(d => d[2]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    option.tooltip = {
        ...base.tooltip,
        position: 'top',
        formatter: (p) => `${xCategories[p.data[0]]}, ${yCategories[p.data[1]]}: ${p.data[2]}`
    };
    option.grid = { ...base.grid, top: 50, bottom: 65 };
    option.xAxis = {
        ...base.xAxis,
        type: 'category',
        data: xCategories,
        name: settings.xAxisName || '',
        splitArea: { show: true }
    };
    option.yAxis = {
        ...base.yAxis,
        type: 'category',
        data: yCategories,
        name: settings.yAxisName || '',
        splitArea: { show: true }
    };
    option.visualMap = {
        min: minVal,
        max: maxVal,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        inRange: {
            color: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b']
        },
        textStyle: { fontFamily: fontFamily, color: '#000', fontSize: 11 }
    };
    option.series = [{
        type: 'heatmap',
        data: heatmapData,
        label: {
            show: heatmapData.length < 100,
            fontSize: 10,
            fontFamily: fontFamily,
            color: '#000'
        },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.3)' } }
    }];

    return addBoxFrame(option);
}

/* ======================== 箱线图 ======================== */
function buildBoxplotOption(option, data, settings, base, fontFamily, colors) {
    const yIndices = (settings.yColumns || [1]).map(col =>
        typeof col === 'number' ? col : data.headers.indexOf(col)
    );

    const boxData = [];
    const outliers = [];
    const categories = [];

    yIndices.forEach(colIdx => {
        const colName = data.headers[colIdx] || `列${colIdx}`;
        categories.push(colName);
        const values = data.rows.map(r => toNumber(r[colIdx])).filter(v => !isNaN(v)).sort((a, b) => a - b);

        if (values.length === 0) {
            boxData.push([0, 0, 0, 0, 0]);
            return;
        }

        const q1 = percentile(values, 25);
        const q2 = percentile(values, 50);
        const q3 = percentile(values, 75);
        const iqr = q3 - q1;
        const lowerWhisker = Math.max(values[0], q1 - 1.5 * iqr);
        const upperWhisker = Math.min(values[values.length - 1], q3 + 1.5 * iqr);

        boxData.push([lowerWhisker, q1, q2, q3, upperWhisker]);

        values.forEach(v => {
            if (v < lowerWhisker || v > upperWhisker) {
                outliers.push([categories.length - 1, v]);
            }
        });
    });

    option.tooltip = { ...base.tooltip, trigger: 'item' };
    option.grid = { ...base.grid };
    option.xAxis = {
        ...base.xAxis,
        type: 'category',
        data: categories,
        name: settings.xAxisName || ''
    };
    option.yAxis = {
        ...base.yAxis,
        type: 'value',
        name: settings.yAxisName || '',
        splitLine: {
            show: settings.showGrid,
            lineStyle: { color: 'rgba(0,0,0,0.1)', type: 'dashed', width: 0.8 }
        }
    };
    option.series = [{
        type: 'boxplot',
        data: boxData,
        itemStyle: { color: '#fff', borderColor: '#000', borderWidth: 1.5 },
        emphasis: { itemStyle: { borderWidth: 2 } }
    }];

    if (outliers.length > 0) {
        option.series.push({
            type: 'scatter',
            data: outliers,
            symbolSize: 5,
            itemStyle: { color: '#e74c3c', borderColor: '#000', borderWidth: 0.5 }
        });
    }

    return addBoxFrame(option);
}

/* ======================== 工具函数 ======================== */

function extractXYData(data, settings) {
    const xColIdx = typeof settings.xColumn === 'number'
        ? settings.xColumn
        : data.headers.indexOf(settings.xColumn);

    const yColIndices = (settings.yColumns || []).map(col =>
        typeof col === 'number' ? col : data.headers.indexOf(col)
    );

    if (yColIndices.length === 0 && data.headers.length > 1) {
        yColIndices.push(xColIdx === 0 ? 1 : 0);
    }

    const xData = data.rows.map(row => row[xColIdx] ?? '');
    const series = yColIndices.map(idx => ({
        name: data.headers[idx] || `列${idx}`,
        data: data.rows.map(row => toNumber(row[idx]))
    }));

    return { xData, series };
}

function toNumber(val) {
    if (typeof val === 'number') return val;
    if (val === null || val === undefined || val === '') return NaN;
    const n = Number(val);
    return isNaN(n) ? NaN : n;
}

function isNumericArray(arr) {
    if (!arr || arr.length === 0) return false;
    const sample = arr.slice(0, Math.min(10, arr.length));
    return sample.every(v => !isNaN(toNumber(v)));
}

function percentile(sortedArr, p) {
    const idx = (p / 100) * (sortedArr.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sortedArr[lower];
    return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (idx - lower);
}
