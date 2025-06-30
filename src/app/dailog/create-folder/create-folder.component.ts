import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UploadedFolder } from 'src/app/models/uploaded-folder.model';

@Component({
  selector: 'app-create-folder',
  templateUrl: './create-folder.component.html',
})
export class CreateFolderComponent {
  folderName: string = '';

  constructor(public dialogRef: MatDialogRef<CreateFolderComponent>) { }

  // Cancel the folder creation
  onCancel(): void {
    this.dialogRef.close();
  }

  // Create/Save folder
  onCreate(): void {
    if (this.folderName.trim()) {
      const newFolder: UploadedFolder = {
        name: this.folderName.trim(),
        files: [],
        size: 0, // Initial size is 0
        createdAt: new Date().toISOString(),
        shared: false // Default value
      };

      this.dialogRef.close({
        confirmed: true,
        folder: newFolder
      });
    }
  }
}
