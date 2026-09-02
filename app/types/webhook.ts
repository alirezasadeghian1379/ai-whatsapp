export type WebhookItem={id:string;name:string;url:string;events:string[];status:string;lastDelivery:unknown};
export type WebhookDelivery={id:string;event:string;httpStatus:number|null;durationMs:number|null;createdAt:string;responseBody:string|null};
export type WebhookForm={name:string;url:string;events:string[]};
