import { Component, Pipe, PipeTransform } from '@angular/core';
import data from './out.json';
import { MessageService } from 'primeng/api';

import { xml2json } from 'xml-js';
import { state } from '@angular/animations';

interface StockTrade {
  date: string,
  netCash: number,
  price: number,
  quantity: number,
  buySell: string,
  notes: string,
}

interface OptionTrade {
  date: string,
  netCash: number,
  price: number,
  quantity: number,
  putCall: string,
  strike: number,
  expiry: string,
  buySell: string,
  notes: string,
}

interface Order {
  summary: StockTrade | OptionTrade | { [x: string]: any },
  trades: (StockTrade | OptionTrade)[]
}

interface Orders {
  [key: string]: Order
}

interface OptionTrades {
  [key: string]: Orders
}

interface Ticker {
  option_trades: OptionTrades
  stock_trades: Orders
  profit?: string,
}

interface Account {
  [key: string]: Ticker
}


interface Data {
  [key: string]: Account
}

@Pipe({ name: 'toStockTable' })
export class toStockTablePipe implements PipeTransform {
  transform(orders: Orders): any[] {
    let buyOrders = Object.values(orders).filter((order: Order) => {
      return order.summary.buySell == 'BUY'
    })

    let sellOrders = Object.values(orders).filter((order: Order) => {
      return order.summary.buySell == 'SELL'
    })

    let rows = []
    while (buyOrders.length > 0 || sellOrders.length > 0) {
      let b = buyOrders.shift()
      let s = sellOrders.shift()
      rows.push([
        b?.summary.date,
        b?.summary.quantity,
        b?.summary.price,
        b?.summary.netCash,
        s?.summary.date,
        s?.summary.quantity,
        s?.summary.price,
        s?.summary.netCash,
      ])
    }
    return rows;
  }
}

@Pipe({ name: 'toOptionTable' })
export class toOptionTablePipe implements PipeTransform {
  transform(symbols: OptionTrades): any[] {
    // console.log("TO OPTIONS TABLE")
    let rows: any = []
    for (let symbol in symbols) {
      // console.log(symbol)
      let orders = Object.values(symbols[symbol])
      // console.log(symbols[symbol])
      if (orders.length) {
        // console.log(orders)
        let buyOrders = Object.values(orders).filter((order: Order) => {
          return order.summary.buySell == 'BUY'
        })

        let sellOrders = Object.values(orders).filter((order: Order) => {
          return order.summary.buySell == 'SELL'
        })

        let subtable = {
          rowspan: Math.max(buyOrders.length, sellOrders.length),
          header: `${symbol.split(" ")[0]}  ${(orders[0].summary as OptionTrade).expiry} ${(orders[0].summary as OptionTrade).strike}${(orders[0].summary as OptionTrade).putCall}`,
          rows: ([] as any)
        }
        while (buyOrders.length > 0 || sellOrders.length > 0) {
          let b = buyOrders.shift()
          let s = sellOrders.shift()
          subtable.rows.push([
            b?.summary.date,
            b?.summary.quantity,
            b?.summary.price,
            b?.summary.netCash,
            s?.summary.date,
            s?.summary.quantity,
            s?.summary.price,
            s?.summary.netCash,
          ])
        }
        rows.push(subtable)
      }
    }
    // console.log(rows)
    return rows;
  }
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

  constructor(private messageService: MessageService) { }

  data: Data = {}

  uploadHandler(event: any) {
    console.log('handler')
    console.log(event)
    event.files.forEach((file: File) => {
      let self = this;
      let read = new FileReader();

      read.readAsBinaryString(file);

      read.onloadend = function () {
        let data = JSON.parse(xml2json(read.result as string, { compact: true }))

        let parsed: Data = {}

        let root = data.FlexQueryResponse.FlexStatements.FlexStatement
        root.forEach((statement: any) => {
          console.log(statement)
          let accountId = statement._attributes.accountId
          parsed[accountId] ??= {};
          statement.Trades.Trade.forEach((tradeobj: any) => {
            let trade = tradeobj._attributes;
            let symbol = trade.symbol
            let ticker = symbol.split(" ")[0]
            let order_id = trade.ibOrderID;
            parsed[accountId][ticker] ??= { "stock_trades": {}, "option_trades": {} }

            if (trade.assetCategory == 'STK') {
              parsed[accountId][ticker]['stock_trades'][order_id] ??= { "trades": [], "summary": {} }

              let stockTrade: StockTrade = {
                'date': trade.tradeDate,
                'quantity': parseInt(trade.quantity),
                'price': parseFloat(trade.tradePrice),
                'netCash': parseFloat(trade.netCash),
                'buySell': trade.buySell,
                'notes': trade.notes,
              }
              parsed[accountId][ticker]['stock_trades'][order_id].trades.push(stockTrade)

            } else if (trade.assetCategory == 'OPT') {
              parsed[accountId][ticker]['option_trades'][symbol] ??= {}
              parsed[accountId][ticker]['option_trades'][symbol][order_id] ??= { "trades": [], "summary": {} }

              let optionTrade: OptionTrade = {
                'date': trade.tradeDate as string,
                'quantity': parseInt(trade.quantity),
                'price': parseFloat(trade.tradePrice),
                'netCash': parseFloat(trade.netCash),
                'putCall': trade.putCall as string,
                'strike': parseFloat(trade.strike),
                'expiry': trade.expiry as string,
                'buySell': trade.buySell,
                'notes': trade.notes,
              }

              parsed[accountId][ticker]['option_trades'][symbol][order_id].trades.push(optionTrade)
            }
          });

        });

        for (let account in parsed) {
          for (let ticker in parsed[account]) {
            for (let orderId in parsed[account][ticker].stock_trades) {
              let trades = parsed[account][ticker]['stock_trades'][orderId].trades
              parsed[account][ticker]['stock_trades'][orderId].summary = {
                'date': trades[0].date,
                'quantity': trades.reduce(function (a, b) { return a + b.quantity }, 0),
                'price': Math.abs(trades.reduce(function (a, b) { return a + b.netCash }, 0) / trades.reduce(function (a, b) { return a + b.quantity }, 0)).toFixed(2),
                'netCash': trades.reduce(function (a, b) { return a + b.netCash }, 0).toFixed(2),
                'buySell': trades[0].buySell,
                'notes': trades[0].notes,
              }
            }

            for (let symbol in parsed[account][ticker].option_trades) {
              console.log(account, ticker, symbol)
              for (let orderId in parsed[account][ticker].option_trades[symbol]) {
                let trades = parsed[account][ticker].option_trades[symbol][orderId].trades as OptionTrade[]
                parsed[account][ticker].option_trades[symbol][orderId].summary = {
                  'date': trades[0].date,
                  'quantity': trades.reduce(function (a, b) { return a + b.quantity }, 0),
                  'price': Math.abs(trades.reduce(function (a, b) { return a + b.netCash }, 0) / trades.reduce(function (a, b) { return a + b.quantity }, 0)).toFixed(2),
                  'netCash': trades.reduce(function (a, b) { return a + b.netCash }, 0).toFixed(2),
                  'putCall': trades[0].putCall,
                  'strike': trades[0].strike,
                  'expiry': trades[0].expiry,
                  'buySell': trades[0].buySell,
                  'notes': trades[0].notes,
                }
                // console.log(parsed[account][ticker].option_trades[symbol][orderId].summary)

              }
            }
            console.log(Object.values(parsed[account][ticker]['stock_trades']))
            console.log(Object.values(parsed[account][ticker]['stock_trades'])
            .reduce(function (a, b) { return a + parseFloat(b.summary.netCash) }, 0))
            parsed[account][ticker].profit = Object.values(parsed[account][ticker]['stock_trades'])
              .reduce(function (a, b) { return a + parseFloat(b.summary.netCash) }, 0).toFixed(2)
          }
        }




        self.data = parsed;
        console.log(self.data)
      }

    });
    this.messageService.add({ severity: 'info', summary: 'File Uploaded', detail: '' });
  }


  stock_columns = {
    "date": "Date",
    "quantity": "Quantity",
    "price": "Price",
    "netCash": "Net Cash"
  }

  empty(obj: object) {
    return Object.keys(obj).length === 0;
  }

  ngOnInit() {
    console.log(this.data)
  }

  print(text: any) {
    return JSON.stringify(text);
  }
}


@Pipe({ name: 'mapToArray' })
export class MapToArray implements PipeTransform {
  transform(value: any): any {
    let arr = [];
    for (let key in value) {
      arr.push({ key: key, value: value[key] });
    }
    return arr;
  }
}