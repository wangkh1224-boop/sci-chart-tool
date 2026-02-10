/**
 * 数据解析模块
 * 支持 CSV / Excel / TSV / TXT / JSON 格式
 * 统一输出 { headers: string[], rows: any[][] }
 */

/**
 * 根据文件类型分发到对应解析器
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  switch (ext) {
    case 'csv':
      return parseCSV(file);
    case 'tsv':
      return parseDelimited(file, '\t');
    case 'txt':
      return parseTXT(file);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'json':
      return parseJSON(file);
    default:
      throw new Error(`不支持的文件格式: .${ext}`);
  }
}

/**
 * CSV 解析 — 使用 Papa Parse
 */
function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete(results) {
        if (results.errors.length > 0) {
          console.warn('CSV 解析警告:', results.errors);
        }
        const data = results.data;
        if (data.length < 2) {
          reject(new Error('数据文件至少需要包含表头和一行数据'));
          return;
        }
        resolve({
          headers: data[0].map(h => String(h || '').trim()),
          rows: data.slice(1)
        });
      },
      error(err) {
        reject(new Error('CSV 解析失败: ' + err.message));
      }
    });
  });
}

/**
 * 指定分隔符解析
 */
function parseDelimited(file, delimiter) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      delimiter: delimiter,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete(results) {
        const data = results.data;
        if (data.length < 2) {
          reject(new Error('数据文件至少需要包含表头和一行数据'));
          return;
        }
        resolve({
          headers: data[0].map(h => String(h || '').trim()),
          rows: data.slice(1)
        });
      },
      error(err) {
        reject(new Error('文件解析失败: ' + err.message));
      }
    });
  });
}

/**
 * TXT 解析 — 自动检测分隔符
 */
function parseTXT(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const firstLine = text.split('\n')[0];

      // 自动检测分隔符
      let delimiter = ',';
      if (firstLine.includes('\t')) delimiter = '\t';
      else if (firstLine.includes(';')) delimiter = ';';
      else if (firstLine.includes('|')) delimiter = '|';

      Papa.parse(text, {
        header: false,
        delimiter: delimiter,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete(results) {
          const data = results.data;
          if (data.length < 2) {
            reject(new Error('数据文件至少需要包含表头和一行数据'));
            return;
          }
          resolve({
            headers: data[0].map(h => String(h || '').trim()),
            rows: data.slice(1)
          });
        },
        error(err) {
          reject(new Error('TXT 解析失败: ' + err.message));
        }
      });
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

/**
 * Excel 解析 — 使用 SheetJS
 */
function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        if (data.length < 2) {
          reject(new Error('Excel 文件至少需要包含表头和一行数据'));
          return;
        }

        // 过滤全空行
        const filteredRows = data.slice(1).filter(row =>
          row.some(cell => cell !== '' && cell !== null && cell !== undefined)
        );

        resolve({
          headers: data[0].map(h => String(h || '').trim()),
          rows: filteredRows
        });
      } catch (err) {
        reject(new Error('Excel 解析失败: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * JSON 解析 — 支持数组格式
 */
function parseJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let json = JSON.parse(e.target.result);

        // 如果是对象包含 data 字段，取 data
        if (!Array.isArray(json) && json.data && Array.isArray(json.data)) {
          json = json.data;
        }

        if (!Array.isArray(json) || json.length === 0) {
          reject(new Error('JSON 文件应为对象数组格式'));
          return;
        }

        const headers = Object.keys(json[0]);
        const rows = json.map(item => headers.map(h => item[h]));

        resolve({ headers, rows });
      } catch (err) {
        reject(new Error('JSON 解析失败: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}
