/**
 * ECharts 主题与配色方案
 * SCI 论文标准风格 — 支持动态字体设置
 */

// 预设配色方案
export const colorSchemes = {
    default: {
        name: '经典',
        colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
    },
    academic: {
        name: '学术',
        colors: ['#2c3e50', '#3498db', '#e74c3c', '#27ae60', '#f39c12', '#8e44ad', '#1abc9c', '#d35400', '#7f8c8d']
    },
    vibrant: {
        name: '活力',
        colors: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a855f7', '#06d6a0', '#118ab2', '#ef476f', '#ffd166', '#073b4c']
    },
    pastel: {
        name: '柔和',
        colors: ['#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2', '#b5ead7', '#c7ceea', '#ffdac1', '#e2f0cb', '#ff9aa2']
    },
    earth: {
        name: '大地',
        colors: ['#8B4513', '#D2691E', '#DAA520', '#556B2F', '#BC8F8F', '#A0522D', '#6B8E23', '#CD853F', '#8FBC8F']
    },
    ocean: {
        name: '海洋',
        colors: ['#006994', '#0099cc', '#40bfb0', '#87ceeb', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#ee9b00']
    },
    nature: {
        name: 'Nature',
        colors: ['#E64B35', '#4DBBD5', '#00A087', '#3C5488', '#F39B7F', '#8491B4', '#91D1C2', '#DC0000', '#7E6148']
    },
    science: {
        name: 'Science',
        colors: ['#3B4992', '#EE0000', '#008B45', '#631879', '#008280', '#BB0021', '#5F559B', '#A20056', '#808180']
    },
    lancet: {
        name: 'Lancet',
        colors: ['#00468B', '#ED0000', '#42B540', '#0099B4', '#925E9F', '#FDAF91', '#AD002A', '#ADB6B6', '#1B1919']
    },
    jama: {
        name: 'JAMA',
        colors: ['#374E55', '#DF8F44', '#00A1D5', '#B24745', '#79AF97', '#6A6599', '#80796B']
    }
};

/**
 * 获取 SCI 标准图表基础主题配置
 * @param {object} settings - 用户自定义设置
 */
export function getBaseThemeOption(settings) {
    const axisColor = '#000000';
    const textColor = '#000000';
    const subtextColor = '#333333';
    const fontFamily = `'${settings.fontFamily || 'Arial'}', 'Noto Sans SC', Helvetica, sans-serif`;
    const axisFontSize = settings.axisFontSize || 12;
    const axisNameFontSize = settings.axisNameFontSize || 14;

    return {
        backgroundColor: '#ffffff',
        textStyle: {
            fontFamily: fontFamily,
            color: textColor
        },
        title: {
            textStyle: {
                fontFamily: fontFamily,
                fontWeight: 'bold',
                color: textColor,
                fontSize: settings.titleFontSize || 14
            },
            subtextStyle: {
                fontFamily: fontFamily,
                color: subtextColor,
                fontSize: 12
            }
        },
        legend: {
            textStyle: {
                fontFamily: fontFamily,
                color: textColor,
                fontSize: axisFontSize
            },
            itemWidth: 25,
            itemHeight: 10,
            itemGap: 16
        },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            borderColor: '#ccc',
            borderWidth: 1,
            textStyle: {
                fontFamily: fontFamily,
                color: textColor,
                fontSize: 12
            },
            borderRadius: 2,
            padding: [6, 10],
            extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.15);'
        },
        xAxis: {
            axisLine: {
                show: true,
                lineStyle: { color: axisColor, width: 1.5 }
            },
            axisTick: {
                show: true,
                inside: true,
                length: 5,
                lineStyle: { color: axisColor, width: 1 }
            },
            minorTick: {
                show: true,
                splitNumber: 2,
                length: 3,
                lineStyle: { color: axisColor, width: 0.8 }
            },
            axisLabel: {
                fontFamily: fontFamily,
                color: textColor,
                fontSize: axisFontSize,
                margin: 10
            },
            nameTextStyle: {
                fontFamily: fontFamily,
                color: textColor,
                fontSize: axisNameFontSize,
                fontWeight: 'bold'
            },
            nameLocation: 'center',
            nameGap: 32,
            splitLine: {
                show: false,
                lineStyle: { color: 'rgba(0,0,0,0.1)', type: 'dashed', width: 0.8 }
            }
        },
        yAxis: {
            axisLine: {
                show: true,
                lineStyle: { color: axisColor, width: 1.5 }
            },
            axisTick: {
                show: true,
                inside: true,
                length: 5,
                lineStyle: { color: axisColor, width: 1 }
            },
            minorTick: {
                show: true,
                splitNumber: 2,
                length: 3,
                lineStyle: { color: axisColor, width: 0.8 }
            },
            axisLabel: {
                fontFamily: fontFamily,
                color: textColor,
                fontSize: axisFontSize,
                margin: 10
            },
            nameTextStyle: {
                fontFamily: fontFamily,
                color: textColor,
                fontSize: axisNameFontSize,
                fontWeight: 'bold'
            },
            nameLocation: 'center',
            nameGap: 50,
            nameRotate: 90,
            splitLine: {
                show: false,
                lineStyle: { color: 'rgba(0,0,0,0.1)', type: 'dashed', width: 0.8 }
            }
        },
        grid: {
            left: 75,
            right: 40,
            top: 50,
            bottom: 60,
            containLabel: false
        },
        toolbox: {
            iconStyle: {
                borderColor: '#666'
            }
        }
    };
}
