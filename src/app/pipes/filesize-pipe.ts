import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filesize',
})
export class FilesizePipe implements PipeTransform {
  transform(bytes: number | string): unknown {
    const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;

    if (isNaN(b) || b === 0) return '0 MB';

    const mb = b / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
}
