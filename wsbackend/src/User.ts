import {WebSocket} from "ws"
import { SubscriptionManage } from "./SubscriptionManager";
import { IncommingMessage , SUBSCRIBE , UNSUBSCRIBE } from "./types/in";
import { outgoingmessage } from "./types/out";

export class User{
    private id: string
    private ws : WebSocket

    constructor(id:string , ws:WebSocket){
        this.id  = id;
        this.ws = ws;
        this.addlistener()
    }

    public emit(message:outgoingmessage){
        this.ws.send(JSON.stringify(message));
    }


    addlistener(){
        this.ws.on("message" , (message:string)=>{
            const parsedmessage :IncommingMessage= JSON.parse(message) ;
            if(parsedmessage.methode === "SUBSCRIBE"){
                parsedmessage.params.forEach(x => SubscriptionManage.getInstance().subscribe(this.id , x));
            }
            if(parsedmessage.methode === "UNSUBSCRIBE"){
                parsedmessage.parmas.forEach(x => SubscriptionManage.getInstance().unsuscribe(this.id , x) )
            }
        })
    }
}