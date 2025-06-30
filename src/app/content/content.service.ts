import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, forkJoin, Observable, of, switchMap, catchError, throwError } from 'rxjs';
import { UploadedFile } from '../models/uploaded-file.model';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  /** ✅ Fetch folders and files into a folderMap */
  fetchAll(): Observable<Map<string, UploadedFile[]>> {
    return forkJoin({
      folders: this.http.get<any[]>(`${this.baseUrl}/folders`),
      files: this.http.get<UploadedFile[]>(`${this.baseUrl}/files`)
    }).pipe(
      map(({ folders, files }) => {
        const folderMap = new Map<string, UploadedFile[]>();

        folders.forEach(folder => {
          folderMap.set(folder.name, folder.files || []);
        });

        folderMap.set('__root__', files);
        return folderMap;
      })
    );
  }

  /** ✅ Rename file by ID */
  renameFile(fileId: string | number, newName: string, folderName?: string): Observable<any> {
    if (folderName) {
      // Rename inside folder
      return this.http.get<any[]>(`${this.baseUrl}/folders?name=${folderName}`).pipe(
        map(folders => folders[0]),
        switchMap(folder => {
          if (!folder) return of(false);
          const updatedFiles = (folder.files || []).map((file: any) => {
            if (file.id === fileId) {
              return { ...file, name: newName };
            }
            return file;
          });
          return this.http.patch(`${this.baseUrl}/folders/${folder.id}`, { files: updatedFiles });
        })
      );
    } else {
      // Rename from root-level files
      return this.http.patch(`${this.baseUrl}/files/${fileId}`, { name: newName });
    }
  }

  /** ✅ Delete file by ID */
  deleteFile(fileId: number | string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/files/${fileId}`);
  }

  /** ✅ Delete file in folder by ID */
  deleteFolderFile(fileId: string, folderName?: string): Observable<any> {
    if (folderName) {
      // Delete file from inside folder
      return this.http.get<any[]>(`${this.baseUrl}/folders?name=${folderName}`).pipe(
        map(folders => folders[0]),
        switchMap(folder => {
          if (!folder) return of(false);
          const updatedFiles = (folder.files || []).filter((f: any) => f.id !== fileId);
          return this.http.patch(`${this.baseUrl}/folders/${folder.id}`, { files: updatedFiles });
        })
      );
    } else {
      // Delete from root-level files
      return this.http.delete(`${this.baseUrl}/files/${fileId}`);
    }
  }

  /** ✅ Rename folder by folder name */
  renameFolderByName(oldName: string, newName: string): Observable<boolean> {
    return this.http.get<any[]>(`${this.baseUrl}/folders?name=${oldName}`).pipe(
      map(results => results[0]),
      map(folder => {
        if (!folder) return false;
        this.http.patch(`${this.baseUrl}/folders/${folder.id}`, { name: newName }).subscribe();
        return true;
      })
    );
  }

  /** ✅ Delete folder by folder name */
  deleteFolderByName(folderName: string): Observable<boolean> {
    return this.http.get<any[]>(`${this.baseUrl}/folders?name=${folderName}`).pipe(
      map(results => results[0]),
      switchMap(folder => {
        if (!folder?.id) return of(false); // no folder found
        return this.http.delete(`${this.baseUrl}/folders/${folder.id}`).pipe(
          map(() => true),
          catchError(() => of(false))
        );
      })
    );
  }

  /** ✅ Change shared status of file, supports folder and root-level */
  updateFileShareStatus(fileId: string | number, shared: boolean, folderName?: string): Observable<any> {
    if (folderName) {
      // File inside a folder
      return this.http.get<any[]>(`${this.baseUrl}/folders?name=${folderName}`).pipe(
        map(folders => folders[0]),
        switchMap(folder => {
          if (!folder) return of(false);
          const updatedFiles = (folder.files || []).map((file: any) =>
            file.id === fileId ? { ...file, shared } : file
          );
          return this.http.patch(`${this.baseUrl}/folders/${folder.id}`, { files: updatedFiles });
        })
      );
    } else {
      // Root-level file
      return this.http.patch(`${this.baseUrl}/files/${fileId}`, { shared });
    }
  }

  /** ✅ Change shared status of file inside folder */
  updateFolderFileShareStatus(folderId: string, fileId: string, shared: boolean): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/folders/${folderId}`).pipe(
      switchMap(folder => {
        const updatedFiles = (folder.files || []).map((file: any) => {
          if (file.id === fileId) {
            return { ...file, shared };
          }
          return file;
        });
        return this.http.patch(`${this.baseUrl}/folders/${folderId}`, { files: updatedFiles });
      })
    );
  }

  /** ✅ Update folder share status */
  updateFolderShareStatus(folderName: string, shared: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/folders/${folderName}`, { shared });
  }

  /** ✅ Move files to folder */
  moveFileToFolder(fileId: string, targetFolderName: string, sourceFolderName?: string): Observable<any> {
    // Case 1: From folder → folder
    if (sourceFolderName) {
      return this.http.get<any[]>(`http://localhost:3000/folders?name=${sourceFolderName}`).pipe(
        map(folders => folders[0]),
        switchMap(sourceFolder => {
          if (!sourceFolder) throw new Error('Source folder not found');

          const file = sourceFolder.files.find((f: any) => f.id === fileId);
          if (!file) throw new Error('File not found in source folder');

          const updatedSourceFiles = sourceFolder.files.filter((f: any) => f.id !== fileId);

          // Remove from source folder
          return this.http.patch(`http://localhost:3000/folders/${sourceFolder.id}`, {
            files: updatedSourceFiles
          }).pipe(
            switchMap(() =>
              this.http.get<any[]>(`http://localhost:3000/folders?name=${targetFolderName}`).pipe(
                map(folders => folders[0]),
                switchMap(targetFolder => {
                  if (!targetFolder) throw new Error('Target folder not found');
                  const updatedTargetFiles = [...(targetFolder.files || []), file];
                  return this.http.patch(`http://localhost:3000/folders/${targetFolder.id}`, {
                    files: updatedTargetFiles
                  });
                })
              )
            )
          );
        })
      );
    }

    // Case 2: From root → folder
    return this.http.get<any>(`http://localhost:3000/files/${fileId}`).pipe(
      switchMap(file =>
        this.http.delete(`http://localhost:3000/files/${fileId}`).pipe(
          switchMap(() =>
            this.http.get<any[]>(`http://localhost:3000/folders?name=${targetFolderName}`).pipe(
              map(folders => folders[0]),
              switchMap(folder => {
                if (!folder) throw new Error('Target folder not found');
                const updatedFiles = [...(folder.files || []), file];
                return this.http.patch(`http://localhost:3000/folders/${folder.id}`, {
                  files: updatedFiles
                });
              })
            )
          )
        )
      )
    );
  }

  /** ✅ From base64 to blob */
  base64ToBlob(base64: string, type: string): Blob {
    const base64Data = base64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = Array.from(byteCharacters).map(char => char.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  }

}