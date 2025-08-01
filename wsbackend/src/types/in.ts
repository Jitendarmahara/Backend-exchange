export const SUBSCRIBE = "SUBSCRIBE";
export const UNSUBSCRIBE = "UNSUBSCRIBE"

export type SubscribeMessage = {
    methode : typeof SUBSCRIBE,
    params: string[]  // to all the rooms they wnat to subscribe;
}

export type UnsubscribeMessage = {
    methode : typeof UNSUBSCRIBE,
    parmas: string[] // to all the rooms they wnat to unsubscribe;
}

export type IncommingMessage = SubscribeMessage | UnsubscribeMessage;