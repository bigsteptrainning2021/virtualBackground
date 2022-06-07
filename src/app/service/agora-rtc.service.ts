import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';
import AgoraRTC, { IAgoraRTCClient, UID } from "agora-rtc-sdk-ng"
import { environment } from 'src/environments/environment';
import VirtualBackgroundExtension from "agora-extension-virtual-background";
@Injectable({
  providedIn: 'root'
})
export class AgoraRTCService {
  screenPublish: any = {
    tracks: {
      screen: {}
    }
  };
  publisher: any = {
    screenClient: "",
    tracks: {
      video: {},
      audio: {},
      screen: {}
    }
  };
  id:any;
  public streaming = new EventEmitter<boolean>();
  public agora = new EventEmitter<any>();
  public agora1 = new EventEmitter<any>();
  extension:any = new VirtualBackgroundExtension();
  // Register the extension

  processor:any;
  remoteStreams: any[] = [];
  constructor() {
    this.publisher.client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    AgoraRTC.registerExtensions([this.extension]);
    this.screenPublish.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    this.publisher.client.setClientRole(environment.credential.role);
    this.publisher.client.enableDualStream().then(() => {
      console.log("Enable Dual stream success!");
    })
  }

  async createVideoTrack() {
    // Create a video track from the video captured by a camera.
    this.publisher.tracks.video = await AgoraRTC.createCameraVideoTrack({
      encoderConfig: "1080p_1",
    });
    this.publisher.client.setLowStreamParameter({
      width: 300,
      height: 240,
      framerate: 25,
      bitrate: 200,
    });
    console.log(this.publisher)


  }

  async createScreenTrack() {

    await AgoraRTC.createScreenVideoTrack({
      encoderConfig: "720p_1",
    }).then(localScreenTrack => {
      this.screenPublish.tracks.screen = localScreenTrack;
      console.log(localScreenTrack)
    });
    this.publishScreenTrack();

  }

  async publishScreenTrack() {
    return await this.screenPublish.client.publish([this.screenPublish.tracks.screen]);
  }

  // async leave(type) {
  //   if (type == "screen") {
  //     await this.screenPublish.client.leave();
  //   }
  //   if (type == "user") {
  //     // await this.unregisterCallbacks();
  //     // await this.publisher.client.leave();
  //   }
  // }
  async UnpublishScreenTrack() {

    return await this.screenPublish.client.unpublish([this.screenPublish.tracks.screen]);

  }
  async createAudioTrack() {
    // Create an audio track from the audio sampled by a microphone.
    this.publisher.tracks.audio = await AgoraRTC.createMicrophoneAudioTrack({
      AEC: true, // acoustic echo cancellation
      AGC: true, // audio gain control
      ANS: true, // automatic noise suppression
      encoderConfig: 'speech_standard',
    });
    this.publisher.client.enableAudioVolumeIndicator();
  }

  async createBothTracks() {
    try {
      // const uid = await this.publisher.client.join(this.options.appId, this.options.channel, this.options.token, null);
      await this.createVideoTrack();
      await this.createAudioTrack();

    }
    catch (err) {
      throw err;
    }
  }
  join(userId:any) {
    if (this.publisher.client && environment) {
      this.setClientEvent();
      return this.publisher.client.join(
        environment.credential.appId,
        environment.credential.channel,
        environment.credential.token,
        userId
      );
    }
  }
  screenjoin(id:any) {
    this.id = id;
    if (this.screenPublish.client && environment) {
      return this.screenPublish.client.join(
        environment.credential.appId,
        environment.credential.channel,
        environment.credential.token,
        `${id}-Screen`
      );
    }
  }


  publish() {
    return this.publisher.client.publish([
      this.publisher.tracks.audio,
      this.publisher.tracks.video,
      // this.publisher.tracks.screen,
    ]);
  }
  Unpublish() {

    return this.publisher.client.unpublish([
      this.publisher.tracks.audio,
      this.publisher.tracks.video,
      // this.publisher.tracks.screen,
    ]);
  }
  setClientEvent() {
    this.publisher.client.on('user-published', this.onUserPublished);
    this.publisher.client.on('user-unpublished', this.onUserUnpublished);
    this.publisher.client.on('user-joined', this.onUserJoined);
    this.publisher.client.on('user-left', this.onUserLeft);
    this.publisher.client.on('network-quality', this.networkQualityHandler);
    this.publisher.client.on('volume-indicator', this.volumeIndicatorHandler);
  }
  unregisterCallbacks() {
    this.publisher.client.off('user-published', this.onUserPublished);
    this.publisher.client.off('user-unpublished', this.onUserUnpublished);
    this.publisher.client.off('user-joined', this.onUserJoined);
    this.publisher.client.off('user-left', this.onUserLeft);
    this.publisher.client.off('network-quality', this.networkQualityHandler);
    this.publisher.client.off('volume-indicator', this.volumeIndicatorHandler);
  }

  networkQualityHandler = async (stats:any) => {
    // network stats
    let emitData = { type: 'network-quality', stats };
    this.agora.emit(emitData);
  };


  volumeIndicatorHandler = async (result:any) => {
    console.log("volume")
    let emitData = { type: 'volume-indicator', result };
    this.agora.emit(emitData);
  };

  onUserPublished = async (user:any, mediaType:any) => {
    const uid = user.uid;
    console.log(uid.split)
    if (uid !== `${this.id}-Screen`) {
      await this.publisher.client.subscribe(user, mediaType);
    }
    await this.publisher.client.setStreamFallbackOption(uid, 1);
    if (mediaType === 'video') {
      this.setRemoteStreamType(uid, 'low');
    }
    if (mediaType === 'audio') {
    }

    let emitData = { type: 'user-published', user, mediaType };
    this.agora.emit(emitData);
  }



  setRemoteStreamType(userId:any, type:any) {
    let flag = 0;
    if (this.publisher.client) {
      if (type == 'low') {
        flag = 1;
      }
      if (type == 'high') {
        flag = 0;
      }
      this.publisher.client.setRemoteVideoStreamType(userId, flag);
    }
  }
  onUserUnpublished = async (user:any, mediaType:any) => {

    await this.publisher.client.unsubscribe(user, mediaType);

    if (mediaType === 'video') {
      console.log('unsubscribe video success');
    }
    if (mediaType === 'audio') {
      console.log('unsubscribe audio success');
    }
    let emitData = { type: 'user-unpublished', user, mediaType };
    console.log("userUnpublish", emitData)
    this.agora.emit(emitData);

  };
  onUserJoined(data:any) {
    // console.log("ddd", data);
  }
  

  onUserLeft = async (user:any, mediaType:any) => {
    let emitData = { type: 'user-left', user, mediaType };
    this.agora.emit(emitData);
  }
}

