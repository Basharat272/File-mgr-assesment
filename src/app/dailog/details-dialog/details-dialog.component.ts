import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UploadedFile } from 'src/app/models/uploaded-file.model';

@Component({
  selector: 'app-details-dialog',
  templateUrl: './details-dialog.component.html'
})
export class DetailsDialogComponent {
  isFile: boolean = false;
  fileData!: UploadedFile;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UploadedFile | string,
    public dialogRef: MatDialogRef<DetailsDialogComponent>
  ) {
    this.isFile = typeof data !== 'string';
    if (this.isFile) {      
      this.fileData = data as UploadedFile;
    }
  }

  // Format the size for view
  formatSize(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
