import { Component, Pipe, PipeTransform } from '@angular/core';
import data from './out.json';
import {MessageService} from 'primeng/api';

interface StockTrade {
  commision: number,
  date: string | number,
  netCash: number,
  price: number,
  quantity: number,
}

interface OptionTrade {
  commision: number,
  date: string | number,
  netCash: number,
  price: number,
  quantity: number,
  putCall: string | number,
  strike: number,
  expiry: string | number,
}

interface Order {
  summary: StockTrade | OptionTrade,
  trades: StockTrade[] | OptionTrade[]
}

interface Orders {
  [key: string]: Order
}

interface Symbols {
  [key: string]: Orders
}

interface Ticker {
  option_trades: Symbols
  stock_trades: Orders
  profit?: number,
}

interface Account {
  [key: string]: Ticker
}


interface Data {
  [key: string]: Account
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  providers: [MessageService]
})
export class AppComponent {
  title = 'ikbr-wheel-tracker';

  uploadedFiles: any[] = [];

  constructor(private messageService: MessageService) {}

  uploadHandler(event: any){
    console.log('handler')
    this.messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
  }
  onUpload(event: any) {
    console.log('onUpload')
      for(let file of event.files) {
          this.uploadedFiles.push(file);
      }

      this.messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
  }


  data = data as Data;

  stock_columns = {
    "date": "Date",
    "quantity": "Quantity",
    "price": "Price",
    "commision": "Commision",
    "netCash": "Net Cash"
  }

  empty(obj: object){
    return Object.keys(obj).length === 0;
  }

  ngOnInit(){
    console.log(this.data)
    for(let account in this.data){
      for(let ticker in this.data[account]){
        this.data[account][ticker].profit = 0;
        for(let stock_order in this.data[account][ticker].stock_trades){
          // this.data[account][ticker].profit += this.data[account][ticker].stock_trades[stock_order].summary.netCash;
        }
      }
    }
  }

  print(text: any){
    return JSON.stringify(text);
  }
}


@Pipe({name: 'mapToArray'})
export class MapToArray implements PipeTransform {
  transform(value: any) : any {
    let arr = [];
    for (let key in value) {
      arr.push({key: key, value: value[key]});
    }
    return arr;
  }
}