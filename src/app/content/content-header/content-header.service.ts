import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UploadedFile } from 'src/app/models/uploaded-file.model';
import { UploadedFolder } from 'src/app/models/uploaded-folder.model';
import { UploadService } from 'src/app/services/upload.service';

@Injectable({ providedIn: 'root' })
export class ContentHeaderService {
  constructor(private http: HttpClient, private uploadService: UploadService) { }

  /** ✅ Get exixting folders from db */
  async getExistingFolders(): Promise<any[]> {
    return await firstValueFrom(this.http.get<any[]>('http://localhost:3000/folders'));
  }

  /** ✅ Get exixting files from db */
  async getExistingFiles(): Promise<any[]> {
    return await firstValueFrom(this.http.get<any[]>('http://localhost:3000/files'));
  }

  /** ✅ Create folder */
  async createFolder(payload: any): Promise<void> {
    await firstValueFrom(this.http.post('http://localhost:3000/folders', payload));
  }

  /** ✅ Refresh files */
  refreshFiles(): void {
    this.http.get<any[]>('http://localhost:3000/files')
      .subscribe(files => {
        this.uploadService.setRootFiles(files);
      });
  }

  /** ✅ Refresh folders */
  refreshFolders(): void {
    const folderMap = new Map<string, UploadedFile[]>();
    const foldersList: UploadedFolder[] = [];

    this.http.get<UploadedFolder[]>('http://localhost:3000/folders').subscribe(folders => {
      folders.forEach(folder => {
        foldersList.push(folder);
        folderMap.set(folder.name, folder.files || []);
      });

      this.http.get<UploadedFile[]>('http://localhost:3000/files').subscribe(files => {
        folderMap.set('__root__', files);
        this.uploadService.setFolderMap(folderMap);
      });
    });
  }

  /** ✅ Inique folder names for folder naming */
  getUniqueFolderName(base: string, usedNames: Set<string>): string {
    let name = base;
    let counter = 1;
    while (usedNames.has(name)) {
      name = `${base}(${counter++})`;
    }
    return name;
  }

} 