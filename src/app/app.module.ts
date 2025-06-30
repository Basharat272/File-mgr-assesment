import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ContentComponent } from './content/content.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ContentHeaderComponent } from './content/content-header/content-header.component';
import { CreateFolderComponent } from './dailog/create-folder/create-folder.component';
import { UploadReviewComponent } from './dailog/upload-review/upload-review.component';
import { FolderViewComponent } from './content/folder-view/folder-view.component';
import { AppRoutingModule, routes } from './app,routing.module';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { RenameDialogComponent } from './dailog/rename-dailog/rename-dailog.component';
import { PreviewDialogComponent } from './dailog/preview-dialog/preview-dialog.component';
import { DetailsDialogComponent } from './dailog/details-dialog/details-dialog.component';
import { MatCommonModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MoveFileDialogComponent } from './dailog/move-file/move-file-dialog.component';
import { MatSelectModule } from '@angular/material/select';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    ContentComponent,
    ContentHeaderComponent,
    SidebarComponent,
    CreateFolderComponent,
    UploadReviewComponent,
    FolderViewComponent,
    RenameDialogComponent,
    PreviewDialogComponent,
    DetailsDialogComponent,
    MoveFileDialogComponent
  ],
  imports: [
    AppRoutingModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    MatCommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatListModule,
    MatMenuModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  exports: [RouterModule]
})
export class AppModule { }
