export enum NotiType {
  MESSAGE = 'message',
  FRIEND_REQUEST = 'friendRequest',
  CALL = 'call',
}


export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO'
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
  AUTH = 'auth',
  PRIVATE_MESSAGE = 'private_message',
  GROUP_MESSAGE = 'group_message',
  TYPING = 'typing',
  MESSAGE_READ = 'message_read',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline'
}