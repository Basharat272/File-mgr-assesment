import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContentService } from 'src/app/content/content.service';
import { UploadedFile } from 'src/app/models/uploaded-file.model';

@Component({
  selector: 'app-preview-dialog',
  templateUrl: './preview-dialog.component.html'
})
export class PreviewDialogComponent implements OnInit {
  safeUrl: SafeResourceUrl | null = null;
  fileTextContent: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { file: UploadedFile, fileUrl: string },
    private sanitizer: DomSanitizer, private contentService: ContentService
  ) { }

  ngOnInit(): void {
    const blob = this.contentService.base64ToBlob(this.data.file.content || '', this.data.file.type);
    if (this.isPdf(this.data.file)) {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
    }
    if (this.isText(this.data.file)) {
      const reader = new FileReader();
      reader.onload = () => {
        this.fileTextContent = reader.result as string;
      };
      reader.readAsText(blob);
    }
  }

  // Check if the file is pdf
  isPdf(file: UploadedFile): boolean {
    return file.type === 'application/pdf';
  }

  // Check if the file is image
  isImage(file: UploadedFile): boolean {
    return file.type?.startsWith('image/');
  }

  // Check if the file is text file
  isText(file: UploadedFile): boolean {
    return file.type === 'text/plain';
  }

  // Check if any other format
  isUnsupported(file: UploadedFile): boolean {
    return !this.isPdf(file) && !this.isImage(file) && !this.isText(file);
  }

}
