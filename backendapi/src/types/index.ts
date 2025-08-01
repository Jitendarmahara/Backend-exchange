
export type MessageFromOrderBook = {
    type:"DEPTH",
    payload:{
        market:string
        ask:[string ,string][]  // ask is an array of tuples which is basically have two values price and quantity
        bid:[string ,string][]
    }
}|{
    type:"ORDER_PLACED",
    payload:{
        orderId:string,
        executedqty:number ,
        fill:[
            {
                price:string,
                qty:number,
                tradId: number
            }
        ]
    }
}|{
    type:"ORDER_CANCELLED",
    payload:{
        orderId:string,
        executedqty:string,
        remaningqty:string
    }
}|{
    type:"OPEN_ORDERS",
    payload:{
        orderId:string,
        executedqty:number,
        quantity:string,
        side:"buy|sell",
        userId:string,
        price:string,
    }[]  // this is an array because i can have multiple order of difirent things like buying eth buying sol ther might some order pendign 
    // so it will be sendign all in that array
}