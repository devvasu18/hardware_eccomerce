const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Generic export helper for CSV, Excel, and PDF formats
 */
class ExportHelper {
    /**
     * Export data to CSV format
     * @param {Array} data - Array of objects to export
     * @param {Array} fields - Array of field names/objects for CSV columns
     * @param {String} filename - Name of the file
     * @param {Object} res - Express response object
     */
    static exportCSV(data, fields, filename, res) {
        try {
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
            return res.status(200).send(csv);
        } catch (error) {
            throw new Error(`CSV Export failed: ${error.message}`);
        }
    }

    /**
     * Export data to Excel format
     * @param {Array} data - Array of objects to export
     * @param {Array} columns - Array of column definitions {header, key, width}
     * @param {String} filename - Name of the file
     * @param {String} sheetName - Name of the worksheet
     * @param {Object} res - Express response object
     */
    static async exportExcel(data, columns, filename, sheetName, res) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(sheetName);

            // Set columns
            worksheet.columns = columns;

            // Style header row
            worksheet.getRow(1).font = { bold: true, size: 12 };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE2E8F0' }
            };

            // Add rows
            worksheet.addRows(data);

            // Auto-fit columns (approximate)
            worksheet.columns.forEach(column => {
                if (!column.width) {
                    column.width = 15;
                }
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
            return workbook.xlsx.write(res).then(() => res.status(200).end());
        } catch (error) {
            throw new Error(`Excel Export failed: ${error.message}`);
        }
    }

    /**
     * Export data to PDF format (table)
     * @param {Array} data - Array of objects to export
     * @param {Array} headers - Array of header labels
     * @param {Array} keys - Array of keys corresponding to headers
     * @param {String} filename - Name of the file
     * @param {String} title - Title of the document
     * @param {Object} res - Express response object
     */
    static exportPDF(data, headers, keys, filename, title, res) {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);

            doc.pipe(res);

            // Title
            doc.fontSize(20).text(title, { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(2);

            // Calculate column widths
            const pageWidth = doc.page.width - 100; // Account for margins
            const colWidth = pageWidth / headers.length;

            // Table header
            doc.fontSize(10).font('Helvetica-Bold');
            let xPos = 50;
            headers.forEach((header, i) => {
                doc.text(header, xPos, doc.y, { width: colWidth, align: 'left' });
                xPos += colWidth;
            });
            doc.moveDown();

            // Draw line under header
            doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
            doc.moveDown(0.5);

            // Table rows
            doc.font('Helvetica').fontSize(9);
            data.forEach((row, rowIndex) => {
                // Check if we need a new page
                if (doc.y > doc.page.height - 100) {
                    doc.addPage();
                    doc.fontSize(10).font('Helvetica-Bold');
                    xPos = 50;
                    headers.forEach((header) => {
                        doc.text(header, xPos, doc.y, { width: colWidth, align: 'left' });
                        xPos += colWidth;
                    });
                    doc.moveDown();
                    doc.font('Helvetica').fontSize(9);
                }

                const startY = doc.y;
                xPos = 50;

                keys.forEach((key, i) => {
                    let value = row[key];
                    if (value === null || value === undefined) value = '';
                    if (typeof value === 'object') value = JSON.stringify(value);
                    value = String(value).substring(0, 100); // Truncate long values

                    doc.text(value, xPos, startY, {
                        width: colWidth - 5,
                        align: 'left',
                        continued: false
                    });
                    xPos += colWidth;
                });

                doc.moveDown(0.5);
            });

            // Footer
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).text(
                    `Page ${i + 1} of ${pages.count}`,
                    50,
                    doc.page.height - 50,
                    { align: 'center' }
                );
            }

            doc.end();
        } catch (error) {
            throw new Error(`PDF Export failed: ${error.message}`);
        }
    }

    /**
     * Main export handler - routes to appropriate format
     * @param {String} format - 'csv', 'excel', or 'pdf'
     * @param {Array} data - Data to export
     * @param {Object} config - Configuration object with format-specific options
     * @param {Object} res - Express response object
     */
    static async export(format, data, config, res) {
        const { filename, title } = config;

        switch (format.toLowerCase()) {
            case 'excel':
                return await this.exportExcel(
                    data,
                    config.columns,
                    filename,
                    config.sheetName || 'Sheet1',
                    res
                );

            case 'pdf':
                return this.exportPDF(
                    data,
                    config.headers,
                    config.keys,
                    filename,
                    title || 'Export',
                    res
                );

            case 'csv':
            default:
                return this.exportCSV(
                    data,
                    config.fields || config.keys,
                    filename,
                    res
                );
        }
    }
}

module.exports = ExportHelper;
