import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CreateFolderService {
  private foldersSubject = new BehaviorSubject<string[]>([]);
  folders$ = this.foldersSubject.asObservable();

  // Create new folder
  addFolder(name: string) {
    const current = this.foldersSubject.value;
    this.foldersSubject.next([...current, name]);
  }
}
