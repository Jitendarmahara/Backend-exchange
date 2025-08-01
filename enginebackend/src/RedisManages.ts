const TRADE_ADDED = "TRADE_ADDED";
const ORDER_UPDATE = "ORDER_UPDATE";
import { RedisClientType, createClient } from "redis";
import { MessageToApi } from "./types/toapi";
 type dbmessage = {
    type : typeof TRADE_ADDED,
    data:{
        Id:string,
        price:string,
        isBuyerMaker:boolean,
        quantity:string,
        quotequantity:string,
        timestamp: number,
        market:string

    }
}|{
        type: typeof ORDER_UPDATE,
        data:{
            orderId: string,
            executedquty:number,
            market?:string,
            price?:string,
            quantity?:string,
            side?: "buy"|"sell"
        }
    }

export class RedisManager{
    private client : RedisClientType;
    private static instance : RedisManager;

    constructor(){
        this.client = createClient();
        this.client.connect();
    }

    public static getInstance(){
        if(!this.instance){
            return new RedisManager();
        }
        return this.instance;
    }
    public pushmessage(message:dbmessage){
        this.client.lPush("db_processor", JSON.stringify(message))
    }
    public sendtoApi(userId:string , message:MessageToApi ){
        this.client.publish(userId , JSON.stringify(message))
    }


    // nedd to add the websocket logic that 
}