import { BASE_CURRENCY } from "./engine";

export interface Order{
    price:number,
    quantity: number,
    filled : number,
    orderId: string,
    side : "buy"| "sell"
    userId: string
}

export interface Fill{
    price: number ,
    quantity:number,
    tradeId:number,
    otheruserId: string
    makeruserid:string
}

export class Orderbook{
    bids:Order[];
    asks: Order[];
    baseAsset: string;
    quoteAsset:string = BASE_CURRENCY;
    latstradeId : number;
    currentprice: number;

    constructor(baseAsset:string , bids:Order[] , ask:Order[]  , currentprice:number , lasttradedId:number){
        this.baseAsset = baseAsset
        this.bids = bids
        this.asks = ask
        this.latstradeId = lasttradedId || 0,
        this.currentprice = currentprice || 0
    }

    // todo to fix the self trade prevention 
    ticker() {
        return `${this.baseAsset}_${this.quoteAsset}`;
    }

    addOrder(order:Order):{executedqty:number , fills:Fill[]}{
        if(order.side === "buy"){
            const{fill , executedqty} = this.matchbid(order)
            order.filled = executedqty;
            if(order.filled === executedqty){
                return{
                    fills:fill,
                    executedqty
                }
            }
            this.bids.push(order)

            return{
                fills:fill,
                executedqty
            }
            
        }
        else{
            const{fills , executedqty} = this.matchask(order);
            order.filled = executedqty;
            if(order.filled === order.quantity ){
                return{
                    fills,
                    executedqty
                }
            }
            this.asks.push(order)
            return{
                fills,
                executedqty
            }
        }
        
    }

    matchbid(order:Order):{fill:Fill[] , executedqty:number}{
        const fill : Fill[] = [];  // the = [] we need to intilaize it thats why we have to do this 
        let executedqty = 0;
        for(let i = 0; i<this.asks.length ; i++){
            if(this.asks[i].price <= order.price && executedqty != order.quantity){
                const filledqty  =Math.min(this.asks[i].quantity , (order.quantity-executedqty))
                executedqty+=filledqty
                this.asks[i].filled += filledqty


                fill.push({
                price:this.asks[i].price,
                quantity:filledqty,
                tradeId: this.latstradeId++,
                otheruserId:this.asks[i].userId,
                makeruserid: this.asks[i].orderId
            })
            }
           

        }
        for(let i = 0; i< this.asks.length ; i++){
            if(this.asks[i].filled === this.asks[i].quantity){
                this.asks.splice(i , 1);
                i--;
            }
        }

        return{
            fill,
            executedqty
        }
    }

    matchask(order:Order):{fills:Fill[] , executedqty:number}{
        const fills:Fill[]  = [];
        let executedqty = 0;
        for(let i = 0 ; i<this.bids.length ; i++){
            if(this.bids[i].price >= order.price && executedqty!=order.quantity){
                const filledqty = Math.min((order.quantity - executedqty) , this.bids[i].quantity);
                executedqty += filledqty;
                this.bids[i].filled += filledqty // dobut directly update // i shall do the +=

                fills.push({
                    price:this.bids[i].price,
                    quantity:filledqty,
                    otheruserId: this.bids[i].userId,
                    makeruserid: this.bids[i].orderId,
                    tradeId: this.latstradeId++
                })
            }
            if(this.bids[i].filled === this.bids[i].quantity){
                this.bids.splice(i , 1);
                i--;
            } 
        }
        return{
            fills,
            executedqty
        }
        
    }
    getDepth(){
        const bid : [string , string][]  = [];
        const ask : [string , string][] = [];

        const bidobj : {[key:string] : number} = {};
        const askobj : {[key:string]:number}  = {};

        for(let i = 0 ; i < this.bids.length ; i++){
            const order = this.bids[i]; // this will containg each order type one by one;
            if(!bidobj[order.price]){
                bidobj[order.price] = 0;
            }
            bidobj[order.price] += order.quantity
        }

        for(let i = 0 ; i< this.asks.length ;i++){
            const order = this.asks[i];
            if(!askobj[order.price]){
                askobj[order.price] = 0;
            }
            askobj[order.price] += order.quantity
        }

        for (const prise in bidobj){
            bid.push([prise, bidobj[prise].toString()])
        }

        for(const prise in askobj){
            ask.push([prise , askobj[prise].toString()])
        }

        return {
            bid,
            ask
        }

    }

    getOpenOrders(userId:string):Order[]{
        const bid = this.bids.filter(x=>x.userId === userId); // filll return an array of all the elemnts that match the condition;
        const ask = this.asks.filter(x=>x.userId === userId);
        return [...bid , ...ask]  // ... spred methidoe it tells bid is an array create a nwe arry with ...bid aalso
    }
    CancleBid(order:Order){
        const index = this.bids.findIndex(x=>x.orderId === order.orderId);
        if(index !== -1){
            const price = this.bids[index].price
            this.bids.splice(index , 1);
            return price
        }
        
    }
    CancleAsk(order:Order){
        const index= this.asks.findIndex(x => x.orderId === order.orderId)
        if(index !== -1){
            const price = this.asks[index].price
            this.asks.splice(index , 1);
            return price;
        }
    }
}

