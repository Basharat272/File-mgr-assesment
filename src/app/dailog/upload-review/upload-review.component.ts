import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UploadService } from 'src/app/services/upload.service';
import { UploadedFile } from 'src/app/models/uploaded-file.model';
import { UploadedFolder } from 'src/app/models/uploaded-folder.model';

interface UploadedItem {
  id: number | string;
  type: 'file' | 'folder';
}

@Component({
  selector: 'app-upload-review',
  templateUrl: './upload-review.component.html',
  styleUrls: ['./upload-review.component.scss']
})

export class UploadReviewComponent implements OnInit {
  files: File[] = [];
  folders: { name: string; files: File[] }[] = [];
  fileProgress: number[] = [];
  folderProgress: number[] = [];
  uploadedItems: UploadedItem[] = [];
  uploading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<UploadReviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { files: File[]; folders: { name: string; files: File[] }[] },
    private uploadService: UploadService
  ) {
    this.files = [...(data.files || [])];
    this.folders = [...(data.folders || [])];
  }

  ngOnInit(): void {
    this.fileProgress = this.files.map(() => 0);
    this.folderProgress = this.folders.map(() => 0);
    this.files = this.data.files || [];
    this.folders = this.data.folders || [];
  }

  // Upload file/folder
  async save(): Promise<void> {
    if (this.uploading) return;
    this.uploading = true;
    const uploadedFolders: UploadedFolder[] = [];
    const uploadedFiles: UploadedFile[] = [];
    try {
      for (let i = 0; i < this.folders.length; i++) {
        this.folderProgress[i] = 30;
        const folder = await this.uploadService.uploadFolder(this.folders[i]);
        this.folderProgress[i] = 100;
        uploadedFolders.push(folder);
        this.uploadedItems.push({ id: folder.id!, type: 'folder' });
      }
      for (let i = 0; i < this.files.length; i++) {
        this.fileProgress[i] = 30;
        console.log("Uploading:", this.files[i]); // ✅ check here
        const file = await this.uploadService.uploadFile(this.files[i]);
        this.fileProgress[i] = 100;
        uploadedFiles.push(file);
        this.uploadedItems.push({ id: file.id!, type: 'file' });
      }
      this.dialogRef.close({
        confirmed: true,
        files: uploadedFiles,
        folders: uploadedFolders
      });
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Please try again.');
    } finally {
      this.uploading = false;
    }
  }

  // Cancel uploading
  async cancel(): Promise<void> {
    for (const item of this.uploadedItems) {
      const endpoint = item.type === 'file' ? 'files' : 'folders';
      await this.uploadService[`http`].delete(`http://localhost:3000/${endpoint}/${item.id}`).toPromise();
    }
    this.dialogRef.close({ confirmed: false });
  }

  // Remove selected files before uploading
  removeFile(index: number): void {
    if (!this.uploading) {
      this.files.splice(index, 1);
      this.fileProgress.splice(index, 1);
    }
  }

  // Remove selected folders before saving
  removeFolder(index: number): void {
    if (!this.uploading) {
      this.folders.splice(index, 1);
      this.folderProgress.splice(index, 1);
    }
  }
}
