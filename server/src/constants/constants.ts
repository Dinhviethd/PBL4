export enum NotiType {
  MESSAGE = 'message',
  FRIEND_REQUEST = 'friendRequest',
  CALL = 'call',
  PASSWORD_CHANGE = 'passwordChange',
}


export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video'
}



export enum StatusNoti {
  DELETED = 'deleted',
  SEEN = 'seen',
  PENDING = 'pending',
}

export enum StatusUser {
  LOCKED = 'locked',
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum FriendStatus {
  PENDING = 'pending',
  BLOCKED = 'blocked',
  ACCEPTED = 'accepted',
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PENDING= "pending",
}

export enum CallStatus {
  MISSED = 'missed',
  ONGOING = 'ongoing',
  ENDED = 'ended',
}
export enum verifiedCodeType{
  EmailVerification = "email_verification",
  PasswordVerification = "password_reset"
}

export enum WSMessageType {
  PRIVATE_MESSAGE = 'PRIVATE_MESSAGE',
  GROUP_MESSAGE = 'GROUP_MESSAGE',
  TYPING = 'TYPING',
  MESSAGE_READ = 'MESSAGE_READ',
  MESSAGE_EDITED = 'MESSAGE_EDITED',
  MESSAGE_DELETED = 'MESSAGE_DELETED',
  USER_ONLINE = 'USER_ONLINE',
  USER_OFFLINE = 'USER_OFFLINE',
  GROUP_ADDED = 'GROUP_ADDED',
  GROUP_APPROVED = 'GROUP_APPROVED',
  USER_LEFT_GROUP = 'USER_LEFT_GROUP',
  KICKED_FROM_GROUP = 'KICKED_FROM_GROUP',
  GROUP_DELETED = 'GROUP_DELETED',
  // Call signaling events
  CALL_INITIATE = 'CALL_INITIATE',
  CALL_OFFER = 'CALL_OFFER',
  CALL_ANSWER = 'CALL_ANSWER',
  CALL_ICE_CANDIDATE = 'CALL_ICE_CANDIDATE',
  CALL_ACCEPT = 'CALL_ACCEPT',
  CALL_DECLINE = 'CALL_DECLINE',
  CALL_END = 'CALL_END',
  CALL_ERROR = 'CALL_ERROR'
}