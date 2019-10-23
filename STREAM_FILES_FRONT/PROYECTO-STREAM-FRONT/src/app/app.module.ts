import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UploadFileComponent } from './components/upload-file/upload-file.component';
import { FormsModule } from '@angular/forms';
import { UploadFileService } from './services/upload-file.service'
import { WebSocketService } from './services/web-socket.service'


@NgModule({
  declarations: [
    AppComponent,
    UploadFileComponent,
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    UploadFileService,
    WebSocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
