import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import {
  ConfirmationDialogComponent,
  ConfirmationDialogData
} from '../components';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialog = inject(MatDialog)

  public confirm(data: ConfirmationDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: data
    });

    return dialogRef.afterClosed();
  }
}
