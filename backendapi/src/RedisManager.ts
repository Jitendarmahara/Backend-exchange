import { createClient , RedisClientType } from "redis";
import { MessageFromOrderBook } from "./types";
import { MessageToEngine } from "./types/to";
import { promise } from "zod";
import { json } from "express";

export class RedisManager{
    private client :RedisClientType
    private publisher:RedisClientType
    private static instance:RedisManager

    private constructor(){
        this.client = createClient(),
        this.client.connect(),
        this.publisher = createClient(),
        this.publisher.connect()
    }

    // this fucntion can be only called from the top class

    public static getInstance(){
        if(!this.instance){
            return new RedisManager();
        }
        return this.instance
    }

    public SendAndAwait(message:MessageToEngine){
        return new Promise<MessageFromOrderBook>((resolve)=>{
            const id = this.getRandomId()
            this.client.subscribe(id , (message)=> {
                this.client.unsubscribe(id);
                resolve(JSON.parse(message));
            })
        }); 
    }

    private getRandomId(){
        return Math.random().toString(36).substring(2 , 15) + Math.random().toString(36).substring(2,15);
    }
}