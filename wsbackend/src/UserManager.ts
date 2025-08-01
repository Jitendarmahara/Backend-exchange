import { WebSocket } from "ws";
import {User} from "./User";
import { SubscriptionManage } from "./SubscriptionManager";
// this userManager manages each user that connects to us it wil help to delete
export class UserManager{
    private static instance : UserManager;
    private users: Map<string , User> = new Map();

    private constructor(){

    }

    public static getInstance(){
        if(!this.instance){
            this.instance = new UserManager();
        }
        return this.instance;
    }
    public adduser(ws: WebSocket){ // this will be adding the user to the map to manage its identity so it will be easy to clean up it..
        const id = this.getRandomId();
        const user = new User(id , ws );
        this.users.set(id , user);
        this.registerOnClose(id , ws);
        return user;   
    }
      public getUser(id: string) {
        return this.users.get(id);
    }

    private getRandomId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    private registerOnClose(id:string , ws:WebSocket){
        ws.on("close" , () =>{
            this.users.delete(id)
            SubscriptionManage.getInstance().userLeft(id);
        })
    }
}