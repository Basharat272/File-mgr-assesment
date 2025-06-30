import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { UploadedFile } from '../models/uploaded-file.model';
import { UploadedFolder } from '../models/uploaded-folder.model';

@Injectable({ providedIn: 'root' })
export class UploadService {
  constructor(private http: HttpClient) { }

  private folderMapSubject = new BehaviorSubject<Map<string, UploadedFile[]>>(new Map());
  folderMap$ = this.folderMapSubject.asObservable();

  // Set folder map
  setFolderMap(updatedMap: Map<string, UploadedFile[]>) {
    this.folderMapSubject.next(updatedMap);
  }

  // Upload files
  async uploadFile(file: File): Promise<UploadedFile> {
    debugger
    const base64 = await this.convertToBase64(file);
    const body: UploadedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      createdAt: new Date().toISOString(),
      content: base64
    };
    return firstValueFrom(this.http.post<UploadedFile>('http://localhost:3000/files', body));
  }

  // Upload folers
  async uploadFolder(folder: { name: string; files: File[] }): Promise<UploadedFolder> {
    const filesWithContent: UploadedFile[] = await Promise.all(
      folder.files.map(async f => ({
        id: this.generateId(),
        name: f.name,
        size: f.size,
        type: f.type || this.getMimeTypeFromName(f.name), // fallback, if file type is coming  ""
        shared: false,
        createdAt: new Date().toISOString(),
        content: await this.convertToBase64(f)
      }))
    );

    const totalSize = filesWithContent.reduce((acc, f) => acc + f.size, 0);
    const oldestDate = filesWithContent.length
      ? new Date(Math.min(...filesWithContent.map(f => new Date(f.createdAt).getTime()))).toISOString()
      : new Date().toISOString();

    const body: UploadedFolder = {
      id: this.generateId(),
      name: folder.name,
      createdAt: oldestDate,
      size: totalSize,
      files: filesWithContent,
      shared: false
    };
    const response = await firstValueFrom(
      this.http.post<UploadedFolder>('http://localhost:3000/folders', body)
    );

    await firstValueFrom(
      this.http.patch(`http://localhost:3000/folders/${response.id}`, {
        shared: false,
        files: response.files
      })
    );
    return response;
  }

  // Convert to base64 for saving to server
  async convertToBase64(file: File): Promise<string> {
    try {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => {
          console.error('Base64 conversion failed');
          reject('Error reading file');
        };
      });
    } catch (e) {
      alert("convertToBase64 error");
      console.error('convertToBase64 error:', e);
      throw e;
    }
  }

  // Generate random Ids
  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Set root files
  setRootFiles(files: any[]) {
    const map = new Map(this.folderMapSubject.value);
    map.set('__root__', files);
    this.folderMapSubject.next(map);
  }

  // Refresh the content after db operation
  refreshContent(): void {
    const folderMap = new Map<string, UploadedFile[]>();
    this.http.get<{ name: string; files: any[] }[]>('http://localhost:3000/folders')
      .subscribe(folders => {
        folders.forEach(folder => {
          folderMap.set(folder.name, folder.files || []);
        });
        this.http.get<any[]>('http://localhost:3000/files').subscribe(files => {
          folderMap.set('__root__', files);
          this.folderMapSubject.next(new Map(folderMap));
        });
      });
  }

  // Get type of files in folder
  getMimeTypeFromName(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const mimeMap: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      txt: 'text/plain',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      json: 'application/json'
    };

    return mimeMap[ext || ''] || 'application/octet-stream';
  }

}
