export enum NotiType {
  MESSAGE = 'message',
  FRIEND_REQUEST = 'friendRequest',
  CALL = 'call',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  AUDIO = 'audio',
  VIDEO = 'video',
  MESSAGE = 'message',
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
