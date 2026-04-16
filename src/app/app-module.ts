import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { JsonTreeComponent } from './components/json-tree/json-tree.component';
import { JsonInputComponent } from './components/json-input/json-input.component';
import { JsonDiffService } from './services/json-diff.service';
import { SampleDataService } from './services/sample-data.service';

@NgModule({
  declarations: [
    App,
    JsonTreeComponent,
    JsonInputComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    JsonDiffService,
    SampleDataService
  ],
  bootstrap: [App]
})
export class AppModule { }
