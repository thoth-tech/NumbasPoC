import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NumbasComponent } from './components/numbas-component/numbas-component.component';


@NgModule({
  declarations: [AppComponent, NumbasComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule], 
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
