import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContentStateService {
  private viewModeSubject = new BehaviorSubject<'grid' | 'list'>('grid');
  viewMode$ = this.viewModeSubject.asObservable();

  /** ✅ Get current view mode - grid/list */
  get currentViewMode(): 'grid' | 'list' {
    return this.viewModeSubject.value;
  }

  /** ✅ Maintain state for view mode */
  setViewMode(mode: 'grid' | 'list') {
    this.viewModeSubject.next(mode);
  }
}
