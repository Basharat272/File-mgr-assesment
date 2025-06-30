import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { CreateFolderComponent } from 'src/app/dailog/create-folder/create-folder.component';
import { UploadReviewComponent } from 'src/app/dailog/upload-review/upload-review.component';
import { CreateFolderService } from 'src/app/services/create-folder.service';
import { ContentHeaderService } from './content-header.service';

@Component({
  selector: 'app-content-header',
  templateUrl: './content-header.component.html',
  styleUrls: ['./content-header.component.scss'],
})
export class ContentHeaderComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('folderInput') folderInput!: ElementRef<HTMLInputElement>;
  @Output() viewToggle = new EventEmitter<'grid' | 'list'>();
  @Output() sortToggle = new EventEmitter<boolean>();
  selectedFiles: File[] = [];
  selectedFolders: { name: string; files: File[] }[] = [];
  isGridView = true;
  isAscending = true;
  constructor(
    private dialog: MatDialog,
    private folderService: CreateFolderService,
    private contentHeaderService: ContentHeaderService
  ) { }

  // Change view mode
  toggleView(): void {
    this.isGridView = !this.isGridView;
    const mode = this.isGridView ? 'grid' : 'list';
    this.viewToggle.emit(mode);
  }

  // Sort files and folders alphabetically
  toggleSort(): void {
    this.isAscending = !this.isAscending;
    this.sortToggle.emit(this.isAscending);
  }
  
  // File upload
  onFileUpload() {
    this.fileInput.nativeElement.click();
  }

  async handleFileSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      // 1. Get already existing names from server
      const existingFiles = await this.contentHeaderService.getExistingFiles(); // fetch from DB
      const serverFileNames = existingFiles.map(f => f.name);

      // 2. Get staged (already selected) names
      const stagedFileNames = this.selectedFiles.map(f => f.name);

      // 3. Collect all used names
      const usedNames = new Set([...serverFileNames, ...stagedFileNames]);

      const uniqueFiles: File[] = [];

      Array.from(files).forEach(file => {
        let originalName = file.name;
        let newName = originalName;
        let counter = 1;

        while (usedNames.has(newName)) {
          const dotIndex = originalName.lastIndexOf('.');
          if (dotIndex !== -1) {
            const namePart = originalName.substring(0, dotIndex);
            const ext = originalName.substring(dotIndex);
            newName = `${namePart}(${counter})${ext}`;
          } else {
            newName = `${originalName}(${counter})`;
          }
          counter++;
        }
        usedNames.add(newName);
        const renamedFile = new File([file], newName, { type: file.type });
        uniqueFiles.push(renamedFile);
      });
      this.selectedFiles = uniqueFiles;
      input.value = '';
      this.openUploadDialog(); 
    }
  }

  openFolderDialog(): void {
    const dialogRef = this.dialog.open(CreateFolderComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.confirmed && result.folder) {
        // Get already existing folders from server
        const existingFolders = await this.contentHeaderService.getExistingFolders();
        const usedNames = new Set(existingFolders.map(f => f.name));
        // Set unique names to folder
        const uniqueName = this.contentHeaderService.getUniqueFolderName(result.folder.name, usedNames);
        usedNames.add(uniqueName);
        const payload = {
          name: uniqueName,
          files: [],
          createdAt: new Date().toISOString()
        };
        // Create folder
        await this.contentHeaderService.createFolder(payload);
        this.folderService.addFolder(uniqueName);
        this.contentHeaderService.refreshFolders();
      }
      this.selectedFiles = [];
      this.selectedFolders = [];
    });
  }

  // Folder upload
  onFolderUpload() {
    this.folderInput.nativeElement.click();
  }

  async handleFolderSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      const fileArray = Array.from(files);
      const folderMap = new Map<string, File[]>();
      fileArray.forEach(file => {
        const path = file.webkitRelativePath;
        const folderName = path.split('/')[0];
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, []);
        }
        folderMap.get(folderName)!.push(file);
      });

      const existingFolders = [
        ...await this.contentHeaderService.getExistingFolders(),
        ...this.selectedFolders // 🟢 Now correctly used before resetting
      ];
      const usedNames = new Set(existingFolders.map(f => f.name));

      const newFolders = Array.from(folderMap.entries()).map(([originalName, files]) => {
        const uniqueName = this.contentHeaderService.getUniqueFolderName(originalName, usedNames);
        usedNames.add(uniqueName);
        return { name: uniqueName, files };
      });

      // Only reset after processing!
      this.selectedFolders = newFolders;
      this.selectedFiles = [];

      this.openUploadDialog();
      input.value = '';
    }
  }

  // Open upload review component to upload files and folders
  async openUploadDialog(): Promise<void> {
    try {
      const clonedFiles = [...this.selectedFiles];
      const clonedFolders = this.selectedFolders.map(f => ({
        name: f.name,
        files: [...f.files]
      }));
      const dialogRef = this.dialog.open(UploadReviewComponent, {
        width: '500px',
        data: { files: clonedFiles, folders: clonedFolders }
      });
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result?.confirmed) {
        this.contentHeaderService.refreshFiles();
        this.contentHeaderService.refreshFolders();

        // ✅ Clear only after successful upload
        this.selectedFiles = [];
        this.selectedFolders = [];
      }
    } catch (e) {
      alert("Dialog failed to open.");
      console.error("Dialog error:", e);
    } finally {
      //this.selectedFiles = [];
      this.selectedFolders = [];
    }
  }

}
