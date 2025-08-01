import { Orderbook } from "../engine/orderbook"
import { ON_RAMP , GET_DEPTH , GET_OPEN_ORDERS } from "./fromapi"
export const ORDER_CANCELLED = "ORDER_CANCELLED"
export const ORDER_PLACED = "ORDER_PLACED"
export type MessageToApi ={
    type: typeof GET_DEPTH,
    payload:{
        bids :[string , string][],
        ask : [string , string][],
    }
}| {
    type: typeof ORDER_CANCELLED
    payload:{
        orderId: string,
        executedqty:number
        remaningqty: number
    }
}|{
    type: typeof ORDER_PLACED,
    payload:{
        orderId :string,
        executedqty:number,
        fill:{
               price: number ,
                quantity:number,
                tradeId:number,
                otheruserId: string
                makeruserid:string
         }[]
    }
}|{
    type: typeof GET_OPEN_ORDERS,
    payload:Orderbook[]
}