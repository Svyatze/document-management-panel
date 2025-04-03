import { Pipe, PipeTransform } from '@angular/core';
import {DocumentStatus} from '../../models';

@Pipe({
  name: 'documentStatus',
  standalone: true
})
export class DocumentStatusPipe implements PipeTransform {
  transform(status: DocumentStatus | string): string {
    if (!status) return '';

    return status.toString()
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
