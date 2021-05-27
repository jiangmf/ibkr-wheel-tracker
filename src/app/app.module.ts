import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { AppComponent, MapToArray, toStockTablePipe, toOptionTablePipe } from './app.component';

import {TableModule} from 'primeng/table';
import {MenubarModule} from 'primeng/menubar';
import {FileUploadModule} from 'primeng/fileupload';
import {ToastModule} from 'primeng/toast';
import {TabViewModule} from 'primeng/tabview';
import {MessageService} from 'primeng/api';

@NgModule({
  declarations: [
    AppComponent,
    MapToArray,
    toStockTablePipe,
    toOptionTablePipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    TableModule,
    MenubarModule,
    FileUploadModule,
    ToastModule,
    TabViewModule
  ],
  providers: [MessageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
