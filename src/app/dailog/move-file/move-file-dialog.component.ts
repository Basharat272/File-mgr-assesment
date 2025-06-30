import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-move-file-dialog',
  templateUrl: 'move-file-dialog.Component.html'
})
export class MoveFileDialogComponent {
  selectedFolder: string = '';
  folders: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<MoveFileDialogComponent>
  ) {
    this.folders = data.folders || [];
  }
}
