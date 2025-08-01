const CREATE_ORDER = "CREATE_ORDER";
 const CANCLE_ORDER = "CANCLE_ORDER";
 const ON_RAMP = "ON_RAMP";
 const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";
 const GET_DEPTH = "GET_DEPTH"

export type MessageToEngine = {
    type: typeof CREATE_ORDER
    data:{
        market:string,
        price:string,
        side:"buy"|"sell",
        userId:string,
        quantity:string
    }
}|{
    type: typeof CANCLE_ORDER
    data:{
        orderId:string,
        market:string
    }
}|{
    type:typeof ON_RAMP
    data:{
        amount:string,
        userId:string,
        txnId:string
    }
}|{
    type: typeof GET_DEPTH
    data:{
        market:string
    }
}|{
    type: typeof GET_OPEN_ORDERS
    data:{
        userId:string,
        market:string
    }
}