import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContentComponent } from './content/content.component';
import { FolderViewComponent } from './content/folder-view/folder-view.component';

export const routes: Routes = [
  { path: '', component: ContentComponent },                
  { path: 'folder/:name', component: FolderViewComponent }  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
