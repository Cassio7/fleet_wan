import { Injectable } from '@nestjs/common';
import { TagDTO } from 'classes/dtos/tag.dto';
import { Workbook } from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ExportService {
  async exportExcel(
    tags: TagDTO[],
    parsedDateFrom: Date,
    parsedDateTo: Date,
    res: Response,
  ) {
    const workbook = new Workbook();
    const dateFromName = parsedDateFrom
      .toLocaleDateString('it-IT')
      .replace(/\//g, '-');
    const dateToName = parsedDateTo
      .toLocaleDateString('it-IT')
      .replace(/\//g, '-');
    const worksheet = workbook.addWorksheet(
      `tags date ${dateFromName}-${dateToName}`,
    );
    worksheet.addRow([
      `EPC,"Type","Timestamp","Latitude","Longitude","Plate","Group","Quality"`,
    ]);
    tags.forEach((tag) => {
      const date = new Date(tag.timestamp);

      const day = String(date.getDate()).padStart(2, '0'); // Ottieni il giorno (con 2 cifre)
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Ottieni il mese (con 2 cifre, +1 perché i mesi partono da 0)
      const year = date.getFullYear(); // Ottieni l'anno
      const hours = String(date.getHours()).padStart(2, '0'); // Ottieni le ore (con 2 cifre)
      const minutes = String(date.getMinutes()).padStart(2, '0'); // Ottieni i minuti (con 2 cifre)
      const seconds = String(date.getSeconds()).padStart(2, '0'); // Ottieni i secondi (con 2 cifre)

      // Crea la variabile date nel formato desiderato
      const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      const row = [
        `EPC_${tag.epc},UHF-EPC,${formattedDate},"${tag.latitude}","${tag.longitude}",${tag.plate},${tag.worksite ?? 'N/A'},${tag.detection_quality}`,
      ];
      worksheet.addRow(row);
    });

    // Imposta intestazioni per il download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=tags-${dateFromName}-${dateToName}.xlsx`,
    );
    await workbook.xlsx.write(res);
  }
}
