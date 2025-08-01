import { RedisManager } from "../RedisManages";
import { CREATE_ORDER , CANCLE_ORDER , GET_DEPTH , GET_OPEN_ORDERS , ON_RAMP, MessageFromApi } from "../types/fromapi";
import { Fill , Order , Orderbook } from "./orderbook";

export const BASE_CURRENCY = "INR";

interface UserBalance{
    [key:string]:{
        available:number,
        locked:number
    }
}


export class engine{
    private orderbooks:Orderbook[] = [];
    private balances:Map<string , UserBalance> = new Map();

    constructor(){
        this.orderbooks = [new Orderbook('TATA' ,[] , [] , 0 , 0 )];
        this.orderbooks = [new Orderbook('RELIANCE-DIGATAL' , [] , [] , 0 , 0)];
        this.orderbooks = [new Orderbook('INFOSYS' , [] , [] , 0 , 0)]
        this.balances.set("1" , {[BASE_CURRENCY]:{
            available:100000,
            locked:0
        }})
    }
    ensureasset(asset:string , balance: UserBalance){
        if(!balance[asset]){
            balance[asset] =  {
                available: 0,
                locked:0
            }
        }
    }
    process({message, clientId}:{message:MessageFromApi , clientId:string}){
        switch(message.type){
            case CREATE_ORDER:{
                try{
                 const{fills , executedqty , orderId}  =  this.createOrder(message.data.price ,message.data.market , message.data.quantity, message.data.side , clientId);
                 RedisManager.getInstance().sendtoApi(clientId, {
                    type:"ORDER_PLACED",
                    payload:{
                        orderId,
                        executedqty,
                        fill:fills
                    }
                 })
                }
                catch(e){
                    console.log(e);
                    RedisManager.getInstance().sendtoApi(clientId , {
                        type:"ORDER_CANCELLED",
                        payload:{
                            executedqty:0,
                            remaningqty:0,
                           orderId : ""

                        }
                    })
                }
            }
             break;
             case CANCLE_ORDER:{
                try{
                    const orderId = message.data.orderId;
                    const canclemarket = message.data.market;
                    const cancleorderbook = this.orderbooks.find(o=>o.ticker() === canclemarket);
                    if(!cancleorderbook){
                        return "no orderbook found"
                    }
                    const quoteAsset = canclemarket.split("_")[1];
                    const baseAsset = canclemarket.split("_")[0];

                    const order  = cancleorderbook.asks.find(x=>x.orderId === orderId) || cancleorderbook.bids.find(x=>x.orderId === orderId);
                    if(!order){
                        return "no order found to be deleted"
                    }

                    if(order.side === "buy"){
                        const price = cancleorderbook.CancleBid(order)
                        const leftquantityprice = (order.quantity - order.filled) * order.price

                        const balance = this.balances.get(order.orderId);
                        if(!balance){
                            return;
                        }
                        this.ensureasset(quoteAsset , balance);
                        balance[quoteAsset].available +=leftquantityprice;
                        balance[quoteAsset].locked -=leftquantityprice
                    }
                    else{
                        const pirce = cancleorderbook.CancleAsk(order);
                        const leftquantityprice = order.quantity - order.filled
                        const balance = this.balances.get(order.orderId);
                        if(!balance)return;
                        this.ensureasset(baseAsset , balance);
                        balance[baseAsset].available += leftquantityprice;
                        balance[baseAsset].locked -= leftquantityprice;
                    }

                }
                catch(e){
                    console.log(e)
                }
             }
        }
    }
 
    createOrder(price:string , market:string , quantity:string  , side:"buy"|"sell" , userId:string ){
        const orderbook = this.orderbooks.find(x=>x.ticker() === market)
        const baseAsset = market.split("_")[0];
        const quoteAsset = market.split("_")[1];
        if(!orderbook){
            throw new Error("no orderbook found")
        }

        this.checkAndLockFunds(baseAsset , quoteAsset , price , quantity , userId , side);

        const order:Order ={
            price: Number(price),
            filled:0,
            quantity:Number(quantity),
            userId,
            side,
            orderId : Math.random().toString(32).slice(2, 15) +Math.random().toString(32).slice(2,15)
        }

        const {fills , executedqty} = orderbook.addOrder(order);
        this.updatebalance(fills , side  , quoteAsset , baseAsset , userId );
        this.updateDbTrade(market , fills , userId)
        this.updateDbOrders(fills , userId ,order , market , executedqty) 

        return{
            fills,
            executedqty,
           orderId: order.orderId
        }
    }

    checkAndLockFunds(baseasset:string , price:string , quantity:string ,quoteasset:string ,userId:string , side:"sell"|"buy"){
        if(side === "buy"){
            if((this.balances.get(userId)?.[quoteasset].available || 0 ) < Number(price)* Number(quantity)){
                return "Insufficient funds"
            }

            const balance = this.balances.get(userId);
            if(!balance){
                return
            }
            if(!balance[quoteasset]){
                balance[quoteasset] ={
                    available :0,
                    locked :0
                };
            }
            balance[quoteasset].available -= Number(price)*Number(quantity);
            balance[quoteasset].locked += Number(price)*Number(quantity);
        }

        else{
            if((this.balances.get(userId)?.[baseasset].available || 0) < Number(quantity) ){
                return "Insufficient Stocks to Trade"
            }
            const UserBalance  = this.balances.get(userId);
            if(!UserBalance){
                return
            }
            if(!UserBalance[baseasset]){
                UserBalance[baseasset] = {
                    available : 0,
                    locked: 0
                }
            }
            UserBalance[baseasset].available -= Number(quantity);
            UserBalance[baseasset].locked +=Number(quantity)
        }
    }
    updateDbOrders(fills:Fill[] , userId:string , order:Order , market:string ,executedqty:number){
        RedisManager.getInstance().pushmessage({
            type: "ORDER_UPDATE",
            data:{
                orderId: order.orderId,
                price: order.price.toString(),
                quantity:order.price.toString(),
                executedquty:executedqty,
                market,
                side:order.side
            }

        })// doubt here why this is sepperate and what this actually doing 
        fills.forEach(x=>{
            RedisManager.getInstance().pushmessage({
                type:"ORDER_UPDATE",
                data:{
                    orderId: x.makeruserid,
                    executedquty : x.quantity
                }
            })
        })


    }
    updateDbTrade(market:string , fills:Fill[] , userId:string){
        fills.forEach(x=>{
            RedisManager.getInstance().pushmessage({    // the pushmanager is redismanges  have a tag og 
                type:"TRADE_ADDED",
                data:{
                    Id:x.tradeId.toString(),
                    price:x.price.toString(),
                    quantity:x.quantity.toString(),
                    quotequantity: (x.quantity * Number(x.price)).toString(),
                    isBuyerMaker: x.otheruserId === userId,
                    market,
                    timestamp:Date.now()
                }
                
            })
        })

    }
    updatebalance(fills:Fill[] , side:"buy"|"sell" ,  quoteAsset:string , baseAsset:string , userId:string){
        if(side === "buy"){
            fills.forEach(x =>{
                const balance = this.balances.get(x.otheruserId);
                const balance1= this.balances.get(userId);
                if(!balance){
                    return;
                }
                if(!balance1){
                    return;
                }
                if(!balance1[quoteAsset]){
                    balance1[quoteAsset] = {
                        available:0,
                        locked:0,
                    }
                }
                if(!balance[quoteAsset]){
                    balance[quoteAsset] ={
                        available :0,
                        locked : 0,
                    }
                }

                balance[quoteAsset].available += (x.price) * (x.quantity);
                balance1[quoteAsset].locked -= x.price * x.quantity;
                balance1[baseAsset].available += x.quantity;
                balance[baseAsset].locked -= x.quantity
            })

        }
        else{
           fills.forEach(x => {
            const balance = this.balances.get(x.otheruserId);
            const balance1 = this.balances.get(userId);
            if(!balance){
                return;
            }
            if(!balance1){
                return;
            }
            if(!balance[quoteAsset]){
                balance[quoteAsset] = {
                    available :0,
                    locked:0
                }
            }
            if(!balance1[quoteAsset]){
                balance1[quoteAsset] = {
                    available :0,
                    locked:0,
                }
            }

            balance1[quoteAsset].available += x.price * x.quantity;
            balance1[baseAsset].locked -= x.quantity;
            balance[quoteAsset].available -= x.price * x.quantity;
            balance[baseAsset].available += x.quantity
           }) 
        }
    }
 
}

