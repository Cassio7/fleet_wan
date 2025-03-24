import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class FileExportService {

  constructor() { }

  /**
   * Crea tramite dei dati un file excel e lo scarica
   * @param data dati con cui creare e popolare il file
   * @param fileName nome del file
   */
  exportToExcel(data: any[], fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const dataBlob: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(dataBlob, fileName);
  }
}
