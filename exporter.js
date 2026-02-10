/**
 * 导出模块 — PNG / SVG
 */

/**
 * 导出为 PNG
 */
export function exportPNG(chartInstance, title) {
    const url = chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 3,
        backgroundColor: 'transparent'
    });
    downloadFile(url, `${title || '图表'}.png`);
}

/**
 * 导出为 SVG
 * 注意：需要 ECharts 使用 SVG 渲染器，这里用 canvas 转换
 */
export function exportSVG(chartInstance, title) {
    // 使用较高分辨率的 PNG 作为 SVG 的内嵌图像
    const url = chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 4,
        backgroundColor: 'transparent'
    });

    const width = chartInstance.getWidth();
    const height = chartInstance.getHeight();

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image xlink:href="${url}" width="${width}" height="${height}"/>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);
    downloadFile(blobUrl, `${title || '图表'}.svg`);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
}

/**
 * 触发文件下载
 */
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
