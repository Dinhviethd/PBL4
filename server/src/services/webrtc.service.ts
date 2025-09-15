// services/webrtcService.ts
interface WebSocketMessage {
  type: string
  data: any
  messageId?: string
}

export interface MediaDevices {
  video: boolean
  audio: boolean
  screen?: boolean
}

export interface PeerConnection {
  id: string
  connection: RTCPeerConnection
  stream?: MediaStream
}

export class WebRTCService {
  private ws: WebSocket
  private localStream?: MediaStream
  private screenStream?: MediaStream
  private peers = new Map<string, PeerConnection>()
  private configuration: RTCConfiguration
  private clientId?: string

  constructor(websocketUrl: string) {
    this.ws = new WebSocket(websocketUrl)
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun1.l.google.com:19302' },
        // Add TURN servers for production
        // {
        //   urls: 'turn:your-turn-server.com:3478',
        //   username: 'username',
        //   credential: 'password'
        // }
      ]
    }

    this.setupWebSocketHandlers()
  }

  private setupWebSocketHandlers() {
    this.ws.onopen = () => {
      console.log('Connected to WebSocket server')
      this.onConnected?.()
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket server')
      this.onDisconnected?.()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.onError?.(error)
    }
  }

  private async handleMessage(message: WebSocketMessage) {
    const { type, data } = message

    switch (type) {
      case 'user-joined':
        console.log('User joined:', data.user)
        await this.createPeerConnection(data.user.socketId)
        await this.createOffer(data.user.socketId)
        this.onUserJoined?.(data.user, data.users)
        break

      case 'user-left':
        console.log('User left:', data.userId)
        this.removePeer(data.userId)
        this.onUserLeft?.(data.userId, data.users)
        break

      case 'receive-offer':
        console.log('Received offer from:', data.from)
        await this.handleReceiveOffer(data.offer, data.from)
        break

      case 'receive-answer':
        console.log('Received answer from:', data.from)
        await this.handleReceiveAnswer(data.answer, data.from)
        break

      case 'ice-candidate':
        console.log('Received ICE candidate from:', data.from)
        await this.handleIceCandidate(data.candidate, data.from)
        break

      case 'media-toggled':
        this.handleMediaToggle(data.userId, data.mediaType, data.enabled)
        break

      case 'screen-share-started':
        this.onScreenShareStarted?.(data.userId)
        break

      case 'screen-share-stopped':
        this.onScreenShareStopped?.(data.userId)
        break

      case 'joined-room':
        this.clientId = data.user.socketId
        this.onRoomJoined?.(data.roomId, data.users)
        break

      case 'join-room-error':
        this.onJoinRoomError?.(data.error)
        break

      case 'receive-message':
        this.onMessageReceived?.(data)
        break

      case 'error':
        console.error('Server error:', data.error)
        this.onError?.(new Error(data.error))
        break

      default:
        console.warn('Unknown message type:', type)
    }
  }

  private sendMessage(type: string, data: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    } else {
      console.warn('WebSocket is not open. Cannot send message:', type)
    }
  }

  async getLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      return this.localStream
    } catch (error) {
      console.error('Error getting local stream:', error)
      throw error
    }
  }

  async getScreenStream(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      return this.screenStream
    } catch (error) {
      console.error('Error getting screen stream:', error)
      throw error
    }
  }

  private async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection(this.configuration)

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!)
      })
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream from:', peerId)
      const [remoteStream] = event.streams
      this.onRemoteStream?.(peerId, remoteStream)
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendMessage('ice-candidate', {
          candidate: event.candidate,
          to: peerId,
          from: this.clientId
        })
      }
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, peerConnection.connectionState)
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        this.removePeer(peerId)
      }
    }

    this.peers.set(peerId, {
      id: peerId,
      connection: peerConnection
    })

    return peerConnection
  }

  private async createOffer(peerId: string) {
    const peer = this.peers.get(peerId)
    if (!peer) return

    try {
      const offer = await peer.connection.createOffer()
      await peer.connection.setLocalDescription(offer)
      
      this.sendMessage('send-offer', {
        offer,
        to: peerId,
        from: this.clientId
      })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  private async handleReceiveOffer(offer: RTCSessionDescriptionInit, from: string) {
    let peer = this.peers.get(from)
    
    if (!peer) {
      await this.createPeerConnection(from)
      peer = this.peers.get(from)!
    }

    try {
      await peer.connection.setRemoteDescription(offer)
      const answer = await peer.connection.createAnswer()
      await peer.connection.setLocalDescription(answer)
      
      this.sendMessage('send-answer', {
        answer,
        to: from,
        from: this.clientId
      })
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  private async handleReceiveAnswer(answer: RTCSessionDescriptionInit, from: string) {
    const peer = this.peers.get(from)
    if (!peer) return

    try {
      await peer.connection.setRemoteDescription(answer)
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit, from: string) {
    const peer = this.peers.get(from)
    if (!peer) return

    try {
      await peer.connection.addIceCandidate(candidate)
    } catch (error) {
      console.error('Error adding ICE candidate:', error)
    }
  }

  private handleMediaToggle(userId: string, mediaType: 'video' | 'audio', enabled: boolean) {
    this.onMediaToggle?.(userId, mediaType, enabled)
  }

  private removePeer(peerId: string) {
    const peer = this.peers.get(peerId)
    if (peer) {
      peer.connection.close()
      this.peers.delete(peerId)
      this.onPeerRemoved?.(peerId)
    }
  }

  // Public methods
  joinRoom(roomId: string, user: { id: string; name: string; avatar?: string }) {
    this.sendMessage('join-room', { roomId, user })
  }

  leaveRoom() {
    this.sendMessage('leave-room', {})
  }

  sendChatMessage(roomId: string, message: string, user: any) {
    this.sendMessage('send-message', {
      roomId,
      message,
      user
    })
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = enabled
        this.sendMessage('toggle-media', {
          roomId: this.currentRoomId,
          userId: this.clientId,
          mediaType: 'video',
          enabled
        })
      }
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = enabled
        this.sendMessage('toggle-media', {
          roomId: this.currentRoomId,
          userId: this.clientId,
          mediaType: 'audio',
          enabled
        })
      }
    }
  }

  async startScreenShare() {
    try {
      this.screenStream = await this.getScreenStream()
      
      // Replace video track in all peer connections
      const videoTrack = this.screenStream.getVideoTracks()[0]
      this.peers.forEach(async (peer) => {
        const sender = peer.connection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        )
        if (sender) {
          await sender.replaceTrack(videoTrack)
        }
      })

      this.sendMessage('start-screen-share', {
        roomId: this.currentRoomId,
        userId: this.clientId
      })

      // Handle screen share end
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare()
      }

      return this.screenStream
    } catch (error) {
      console.error('Error starting screen share:', error)
      throw error
    }
  }

  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop())
      this.screenStream = undefined
    }

    // Replace back to camera
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      this.peers.forEach(async (peer) => {
        const sender = peer.connection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        )
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack)
        }
      })
    }

    this.sendMessage('stop-screen-share', {
      roomId: this.currentRoomId,
      userId: this.clientId
    })
  }

  disconnect() {
    // Stop all streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop())
    }

    // Close all peer connections
    this.peers.forEach(peer => peer.connection.close())
    this.peers.clear()

    // Close WebSocket
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close()
    }
  }

  // Callback functions (set by the client)
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Error | Event) => void
  onRoomJoined?: (roomId: string, users: any[]) => void
  onJoinRoomError?: (error: string) => void
  onUserJoined?: (user: any, users: any[]) => void
  onUserLeft?: (userId: string, users: any[]) => void
  onRemoteStream?: (peerId: string, stream: MediaStream) => void
  onPeerRemoved?: (peerId: string) => void
  onMediaToggle?: (userId: string, mediaType: 'video' | 'audio', enabled: boolean) => void
  onScreenShareStarted?: (userId: string) => void
  onScreenShareStopped?: (userId: string) => void
  onMessageReceived?: (message: any) => void
  
  private currentRoomId?: string
  setRoomId(roomId: string) {
    this.currentRoomId = roomId
  }
}