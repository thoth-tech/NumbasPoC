import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NumbasComponent } from './components/numbas-component/numbas-component.component';
import { ScormService } from './services/SCORM/scorm-service';
import { ScormAPIImplementation } from './services/SCORM/scorm-api-implementation';
import { WINDOW } from './services/SCORM/window-token';


@NgModule({
  declarations: [AppComponent, NumbasComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule], 
  providers: [
    ScormService,
    ScormAPIImplementation,
    {
      provide: WINDOW,
      useValue: window,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
