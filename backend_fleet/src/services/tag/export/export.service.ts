import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { TagDTO } from 'classes/dtos/tag.dto';
import { createHash } from 'crypto';
import { Workbook } from 'exceljs';
import { Response } from 'express';
import Redis from 'ioredis';

@Injectable()
export class ExportService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

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
    const redisKey = this.generateUniqueKey(
      tags.length,
      dateFromName,
      dateToName,
    );
    console.time('redis save export');
    this.setRedisExport(workbook, redisKey);
    console.timeEnd('redis save export');

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

  async getRedisExport(redisKey: string): Promise<Buffer | null> {
    const existingExport = await this.redis.get(redisKey);

    if (existingExport) {
      const workbookBuffer = Buffer.from(existingExport, 'base64');

      return workbookBuffer;
    }
    return null;
  }

  async setRedisExport(workbook: Workbook, redisKey: string) {
    // Crea un buffer per il file Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Salva il file in Redis come stringa base64
    await this.redis.set(redisKey, buffer.toString());

    // Imposta un tempo di scadenza (opzionale, ad esempio 24 ore)
    await this.redis.expire(redisKey, 60 * 60 * 24 * 30);
  }

  async checkRedisExport(
    tagsCount: number,
    parsedDateFrom: Date,
    parsedDateTo: Date,
    res: Response,
  ): Promise<void> {
    const dateFromName = parsedDateFrom
      .toLocaleDateString('it-IT')
      .replace(/\//g, '-');
    const dateToName = parsedDateTo
      .toLocaleDateString('it-IT')
      .replace(/\//g, '-');
    const redisKey = this.generateUniqueKey(
      tagsCount,
      dateFromName,
      dateToName,
    );
    const existingExport = await this.redis.get(redisKey);

    if (existingExport) {
      // Se esiste già, restituisci il file salvato in Redis
      const workbookBuffer = Buffer.from(existingExport, 'base64');

      // Imposta intestazioni per il download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=tags-${dateFromName}-${dateToName}.xlsx`,
      );

      res.send(workbookBuffer);
    }
    return null;
  }

  private generateUniqueKey(
    tags: number,
    dateFrom: string,
    dateTo: string,
  ): string {
    const hashContent = JSON.stringify({
      tagsLength: tags,
      dateFrom: dateFrom,
      dateTo: dateTo,
    });

    const contentHash = createHash('sha256').update(hashContent).digest('hex');
    // Combina l'hash con le date per avere una chiave leggibile ma univoca
    return `excel_export:${contentHash}`;
  }
}
