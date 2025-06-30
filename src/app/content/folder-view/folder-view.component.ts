import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { UploadService } from 'src/app/services/upload.service';
import { ContentService } from '../content.service';
import { ContentStateService } from '../content-state.service';
import { RenameDialogComponent } from 'src/app/dailog/rename-dailog/rename-dailog.component';
import { PreviewDialogComponent } from 'src/app/dailog/preview-dialog/preview-dialog.component';
import { DetailsDialogComponent } from 'src/app/dailog/details-dialog/details-dialog.component';
import { UploadedFile } from 'src/app/models/uploaded-file.model';
import { UploadedFolder } from 'src/app/models/uploaded-folder.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-folder-view',
  templateUrl: './folder-view.component.html',
  styleUrls: ['./folder-view.component.scss']
})
export class FolderViewComponent implements OnInit, OnDestroy {
  folderName: string = '';
  files: UploadedFile[] = [];
  previewMap = new Map<string, string>();
  viewMode: 'grid' | 'list' = 'grid';
  selectedFile: UploadedFile | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private uploadService: UploadService,
    private contentService: ContentService,
    private dialog: MatDialog,
    private state: ContentStateService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.viewMode = this.state.currentViewMode;
    this.state.viewMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => this.viewMode = mode);
    this.folderName = this.route.snapshot.paramMap.get('name') || '';
    this.uploadService.folderMap$
      .pipe(takeUntil(this.destroy$))
      .subscribe(folderMap => {
        const folderFiles = folderMap.get(this.folderName) || [];
        this.files = folderFiles;
        this.previewMap.clear();
        folderFiles.forEach(file => {
          if (this.isImage(file) && file.content) {
            this.previewMap.set(file.name, file.content);
          }
        });
      });
    this.refreshContent();
  }

  // Change view mode
  onViewToggle(mode: 'grid' | 'list') {
    this.state.setViewMode(mode);
  }

  // Refresh the content on load and after db operation
  refreshContent(): void {
    this.contentService.fetchAll().subscribe(folderMap => {
      this.uploadService.setFolderMap(folderMap);
    });
  }

  // Move back to main content screen
  goBack(): void {
    this.router.navigate(['/']);
  }

  // Open file for view
  openFile(file: UploadedFile): void {
    if (!file?.content || !file?.type) {
      alert('Invalid file content or type');
      return;
    }
    try {
      const blob = this.contentService.base64ToBlob(file.content, file.type);
      const url = URL.createObjectURL(blob);

      this.dialog.open(PreviewDialogComponent, {
        width: '800px',
        data: {
          file,
          fileUrl: url
        }
      });
    } catch (e) {
      alert('Error opening file.');
      console.error(e);
    }
  }

  // Check if file is image
  isImage(file: UploadedFile): boolean {
    return file.type?.startsWith('image/');
  }

  // Get size of file
  formatFileSize(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  // View metadata in dialog
  viewDetails(item: UploadedFile | UploadedFolder): void {
    this.dialog.open(DetailsDialogComponent, {
      width: '400px',
      data: item
    });
  }

  // Rename the file
  renameFile(file: UploadedFile): void {
    const dialogRef = this.dialog.open(RenameDialogComponent, {
      width: '400px',
      data: { currentName: file.name, type: 'file' }
    });

    dialogRef.afterClosed().subscribe(async newName => {
      if (newName && newName !== file.name) {
        // 🗂 Check duplicates inside the same folder
        const folder = await firstValueFrom(
          this.http.get<any[]>(`http://localhost:3000/folders?name=${this.folderName}`)
        );
        const folderFiles: UploadedFile[] = folder[0]?.files || [];

        const duplicateExists = folderFiles.some(f => f.name === newName && f.id !== file.id);
        if (duplicateExists) {
          alert(`A file named "${newName}" already exists in folder "${this.folderName}".`);
          return;
        }

        // ✅ Proceed to rename
        this.contentService.renameFile(file.id!, newName, this.folderName).subscribe(() => {
          file.name = newName;
          setTimeout(() => this.refreshContent(), 300);
        });
      }
    });
  }

  // Share and unshare the file or folder
  toggleShare(item: UploadedFile | UploadedFolder): void {
    const newStatus = !item.shared;
    this.contentService.updateFileShareStatus(item.id!, newStatus, this.folderName).subscribe(() => {
      item.shared = newStatus;
    });
  }

  // Delete the file
  deleteFile(file: UploadedFile) {
    if (confirm(`Delete ${file.name}?`)) {
      this.contentService.deleteFolderFile(file.id!, this.folderName).subscribe(() => {
        this.files = this.files.filter(f => f.id !== file.id);
        this.refreshContent();
      });
    }
  }

  // Download the file
  downloadFile(file: UploadedFile): void {
    const blob = this.contentService.base64ToBlob(file.content || '', file.type);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();

    URL.revokeObjectURL(url);
  }

  // Copy the link of the file
  copyLink(file: UploadedFile): void {
    const link = `${window.location.origin}/shared/${file.id}`;
    navigator.clipboard.writeText(link)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => alert('Failed to copy link.'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
