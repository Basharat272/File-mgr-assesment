import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-rename-dialog',
  templateUrl: './rename-dailog.component.html'
})
export class RenameDialogComponent {
  newName: string;
  type: 'file' | 'folder';

  constructor(
    public dialogRef: MatDialogRef<RenameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentName: string, type: 'file' | 'folder' }
  ) {
    this.newName = data.currentName;
    this.type = data.type;
  }

  // Rename the file/folder
  save() {
    this.dialogRef.close(this.newName);
  }

  // Cancel renaming
  cancel() {
    this.dialogRef.close(null);
  }
}
