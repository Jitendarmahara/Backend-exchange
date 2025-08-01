import {RedisClientType , createClient} from "redis"
export class SubscriptionManage{
    private static instance : SubscriptionManage
    private subscriptions:Map<string , string[]> = new Map()
    private reversesubscription :Map<string , string[]> = new Map();
    private redisClient: RedisClientType;

    private constructor(){
        this.redisClient = createClient();
        this.redisClient.connect();
    }

    public static getInstance(){
        if(!this.instance){
            this.instance =  new SubscriptionManage();
        }
        return this.instance
    }


    public subscribe(userId:string , subscription:string){
        if(this.subscriptions.get(userId)?.includes(subscription)){
            return
        }
        this.subscriptions.set(userId , (this.subscriptions.get(userId) || [] ). concat(subscription));
        this.reversesubscription.set(subscription , (this.reversesubscription.get(subscription)|| []).concat(userId))

        if(this.reversesubscription.get(subscription)?.length === 1){
            this.redisClient.subscribe(subscription , (onmessage)=>{

            })
        }
    }

    public unsuscribe(userId:string , subscription:string){
        const subscriptions = this.subscriptions.get(userId);
         if(!subscriptions){
            return
         }
         // removing just form the array of subscriptions does not menas that it is udpate in .set we need to call it on that .set
        this.subscriptions.set(userId , subscriptions.filter(x => x !== subscription));
        const reversesubscription = this.reversesubscription.get(subscription);
        if(reversesubscription){
            this.reversesubscription.set(subscription , reversesubscription.filter(x => x !== userId) );
            // as u  remove it form this list it might be the last user so u need to check it 
            if(this.reversesubscription.get(subscription)?.length === 0){
                this.reversesubscription.delete(subscription);
                this.redisClient.unsubscribe(subscription)
            }
        }
    }
    public userLeft(userId:string){
        console.log("usrlet"+ userId);
        this.subscriptions.get(userId)?.forEach(x => this.unsuscribe(userId , x))
    }

    public getSubscriptions(userId:string){
        return this.subscriptions.get(userId) || [];
    }
}