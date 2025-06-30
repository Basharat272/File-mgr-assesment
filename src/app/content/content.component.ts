import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
  ViewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import * as JSZip from 'jszip';
import { RenameDialogComponent } from '../dailog/rename-dailog/rename-dailog.component';
import { PreviewDialogComponent } from '../dailog/preview-dialog/preview-dialog.component';
import { DetailsDialogComponent } from '../dailog/details-dialog/details-dialog.component';
import { UploadReviewComponent } from '../dailog/upload-review/upload-review.component';
import { UploadService } from '../services/upload.service';
import { ContentService } from './content.service';
import { ContentStateService } from './content-state.service';
import { ContentHeaderService } from './content-header/content-header.service';
import { UploadedFile } from '../models/uploaded-file.model';
import { UploadedFolder } from '../models/uploaded-folder.model';
import { MoveFileDialogComponent } from '../dailog/move-file/move-file-dialog.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss']
})
export class ContentComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  folders: UploadedFolder[] = [];
  files: UploadedFile[] = [];
  currentFolder: string | null = null;
  folderFiles = new Map<string, UploadedFile[]>();
  previewMap = new Map<string, string>();
  selectedFile: UploadedFile | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  sortAscending = true;
  selectedFiles: File[] = [];
  selectedFolders: { name: string; files: File[] }[] = [];
  folderName: string = '';
  constructor(
    private uploadService: UploadService,
    private contentService: ContentService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private state: ContentStateService,
    private contentHeaderService: ContentHeaderService,
    private cd: ChangeDetectorRef,
    private http: HttpClient
  ) { }

  get isTrulyEmpty(): boolean {
    return this.folders.length === 0 && this.files.length === 0;
  }

  get isEmptyFolder(): boolean {
    if (this.currentFolder || this.files.length > 0) return false;
    return Array.from(this.folderFiles.values()).every(files => files.length === 0);
  }

  ngOnInit(): void {
    this.state.viewMode$.subscribe(mode => this.viewMode = mode);
    this.uploadService.folderMap$.subscribe(folderMap => {
      this.folderFiles = folderMap;
      this.folders = Array.from(folderMap.entries())
        .filter(([name]) => name !== '__root__')
        .map(([name, files]) => ({
          name,
          files,
          size: files.reduce((acc, f) => acc + (f.size || 0), 0),
          createdAt: files.length
            ? new Date(Math.min(...files.map(f => new Date(f.createdAt).getTime()))).toISOString()
            : new Date().toISOString()
        }));
      this.updateFilesView(folderMap);
      this.clearPreviews();
      folderMap.forEach(fileList => {
        fileList.forEach(file => {
          if (this.isImage(file) && file.content) {
            this.previewMap.set(file.name, file.content);
          }
        });
      });
    });
    this.refreshContent();
  }

  // Change view mode
  onViewToggle(mode: 'grid' | 'list') {
    this.state.setViewMode(mode);
    this.currentFolder = '';
    this.router.navigate(['/content']);
  }

  // Sort files and folders alphabetically
  onSortToggle(isAsc: boolean): void {
    this.sortAscending = isAsc;
    const sortFn = (a: string, b: string) => isAsc ? a.localeCompare(b) : b.localeCompare(a);
    this.folders.sort((a, b) => sortFn(a.name, b.name));
    this.files.sort((a, b) => sortFn(a.name, b.name));
  }

  // Check if file is image
  isImage(file: UploadedFile): boolean {
    if (!file || !file.type) return false;
    return /^image\/.+/.test(file.type);
  }

  // Upload file windows popup
  onFileUpload() {
    this.fileInput.nativeElement.click();
  }

  // Open file for preview
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

  // Process before file selection
  handleFileSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      input.value = '';
      this.openUploadDialog();
    }
  }

  // Open review upload dialog
  async openUploadDialog(): Promise<void> {
    const dialogRef = this.dialog.open(UploadReviewComponent, {
      width: '500px',
      data: {
        files: [...this.selectedFiles],
        folders: this.selectedFolders.map(f => ({ name: f.name, files: [...f.files] }))
      }
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result?.confirmed) {
      this.contentHeaderService.refreshFiles();
      this.contentHeaderService.refreshFolders();
    }
    this.selectedFiles = [];
    this.selectedFolders = [];
  }

  // Update files
  updateFilesView(folderMap: Map<string, UploadedFile[]>) {
    const key = this.currentFolder && folderMap.has(this.currentFolder)
      ? this.currentFolder
      : '__root__';

    this.files = [...(folderMap.get(key) || [])];
  }

  // Clear preview
  clearPreviews() {
    this.previewMap.clear();
  }

  // Open folder
  goToFolder(folder: UploadedFolder) {
    if (this.viewMode === 'grid') {
      this.router.navigate(['/folder', folder.name]);
    } else {
      this.currentFolder = folder.name;
      this.updateFilesView(this.folderFiles);
    }
  }

  // Move back to main
  goBack() {
    this.currentFolder = null;
    this.updateFilesView(this.folderFiles);
  }

  // View metadata in dialog
  viewDetails(item: UploadedFile | UploadedFolder) {
    this.dialog.open(DetailsDialogComponent, {
      width: '400px',
      data: item
    });
  }

  // Rename the file
  renameFile(file: UploadedFile) {
    const dialogRef = this.dialog.open(RenameDialogComponent, {
      width: '400px',
      data: { currentName: file.name, type: 'file' }
    });

    dialogRef.afterClosed().subscribe(async newName => {
      if (newName && newName !== file.name) {
        // 🔍 Check if a file with the new name already exists
        const allFiles = await firstValueFrom(this.http.get<UploadedFile[]>('http://localhost:3000/files'));
        const duplicateExists = allFiles.some(f => f.name === newName && f.id !== file.id);

        if (duplicateExists) {
          alert(`A file named "${newName}" already exists.`);
          return;
        }

        // ✅ Rename if no conflict
        this.contentService.renameFile(file.id!, newName).subscribe(() => {
          file.name = newName;
          setTimeout(() => this.refreshContent(), 300); // Give backend time to sync
        });
      }
    });
  }

  // Delete the file
  deleteFile(file: UploadedFile) {
    if (confirm(`Delete ${file.name}?`)) {
      this.contentService.deleteFile(file.id!).subscribe(() => {
        this.refreshContent();
      });
    }
  }

  // Share/ unshare the file/folder
  toggleShare(item: UploadedFile | UploadedFolder) {
    const newStatus = !item.shared;
    if ('type' in item) {
      this.contentService.updateFileShareStatus(item.id!, newStatus).subscribe(() => item.shared = newStatus);
    } else {
      this.contentService.updateFolderShareStatus(item.name, newStatus).subscribe(() => item.shared = newStatus);
    }
  }

  // Move file to folder
  moveFile(file: UploadedFile): void {
    this.dialog.open(MoveFileDialogComponent, {
      width: '400px',
      data: { folders: this.folders }
    }).afterClosed().subscribe((selectedFolder: string) => {
      if (selectedFolder) {
        this.contentService.moveFileToFolder(file.id!, selectedFolder).subscribe({
          next: () => this.refreshContent(),
          error: err => alert('Failed to move file: ' + err.message)
        });
      }
    });
  }

  // Rename the folder
  renameFolder(folderName: string) {
    const dialogRef = this.dialog.open(RenameDialogComponent, {
      width: '400px',
      data: { currentName: folderName, type: 'folder' }
    });

    dialogRef.afterClosed().subscribe(async newName => {
      if (newName && newName !== folderName) {
        // Check if newName already exists in DB
        const allFolders = await firstValueFrom(this.http.get<any[]>('http://localhost:3000/folders'));
        const nameExists = allFolders.some(f => f.name === newName && f.name !== folderName);

        if (nameExists) {
          alert(`A folder named "${newName}" already exists.`);
          return;
        }

        this.contentService.renameFolderByName(folderName, newName).subscribe(() => {
          // Small delay to allow backend update before refreshing
          setTimeout(() => this.refreshContent(), 300);
        });
      }
    });
  }

  // Delete the folder
  deleteFolder(folderName: string) {
    if (confirm(`Delete folder "${folderName}"?`)) {
      this.contentService.deleteFolderByName(folderName).subscribe(success => {
        if (success) this.refreshContent();
      });
    }
  }

  // Refresh the content on load and after db operation
  refreshContent() {
    this.contentService.fetchAll().subscribe(folderMap => this.uploadService.setFolderMap(folderMap));
  }

  // Download the file
  downloadFile(file: UploadedFile) {
    const blob = this.contentService.base64ToBlob(file.content || '', file.type);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Copy the link of file
  copyLink(file: UploadedFile) {
    const link = `${window.location.origin}/shared/${file.id}`;
    navigator.clipboard.writeText(link).then(
      () => alert('Link copied to clipboard!'),
      () => alert('Failed to copy link.')
    );
  }

  // Download folder
  async downloadFolder(folder: UploadedFolder) {
    const zip = new JSZip();
    folder.files?.forEach(file => {
      const blob = this.contentService.base64ToBlob(file.content || '', file.type);
      zip.file(file.name, blob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `${folder.name}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Copy link of folder
  copyFolderLink(folder: UploadedFolder) {
    const link = `${window.location.origin}/shared/folder/${folder.name}`;
    navigator.clipboard.writeText(link).then(
      () => alert('Folder link copied to clipboard!'),
      () => alert('Failed to copy folder link.')
    );
  }

  // Get size of folder
  getFolderSize(folder: UploadedFolder): string {
    const totalSize = (folder.files || []).reduce((acc, f) => acc + (f.size || 0), 0);
    return this.formatFileSize(totalSize);
  }

  // Get date of folder
  getFolderDate(folder: UploadedFolder): string {
    const files = folder.files || [];
    if (!files.length) return 'Empty';
    const oldest = new Date(Math.min(...files.map(f => new Date(f.createdAt).getTime())));
    return oldest.toLocaleDateString();
  }

  // Format size of file
  formatFileSize(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  // trackbyId for update view
  trackByFileId(index: number, file: UploadedFile): string | number {
    return file.id!;
  }

  ngOnDestroy(): void {
    this.clearPreviews();
  }

}
