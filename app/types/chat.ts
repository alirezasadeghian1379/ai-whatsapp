export type ChatContact={name:string|null;phone:string;notes:string|null;tags:unknown};
export type ChatSession={status:string;displayName:string|null};
export type ChatMessage={id:string;body:string|null;direction:string;source:string;status:string;createdAt:string;sentAt:string|null};
export type ChatConversation={id:string;isPinned:boolean;isArchived:boolean;unreadCount:number;lastMessageAt:string|null;contact:ChatContact;session:ChatSession;lastMessage:{body:string|null;createdAt:string;direction:string}|null};
export type ChatDetail=ChatConversation&{messages:ChatMessage[]};
