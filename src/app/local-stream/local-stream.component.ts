import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AgoraRTCService } from '../service/agora-rtc.service';
import { IndexService } from '../service/index.service';
@Component({
  selector: 'app-local-stream',
  templateUrl: './local-stream.component.html',
  styleUrls: ['./local-stream.component.scss'],
})
export class LocalStreamComponent implements OnInit, OnDestroy {
  @ViewChild('video') viewChild: any;
  selectedImage: string = '';
  id: string = 'madhur';
  track: any;
  selfieSegmentation: any;
  canvasCtx: any;
  canvasElement: any;
  backgroundConfig: any;
  image: any;
  videoElement: HTMLVideoElement | undefined;
  isBackgroundSourceLoading: boolean = false;
  backgroundBlurLevel: any;
  isSegmentationRunning: any;
  mediaStream: any;
  video: any;
  isStreamplay: boolean = true;
  imageName: any;
  allowDevice: boolean = true;
  loading_flag: boolean = false;
  selectedFlag: boolean = false;
  constructor(
    private agoraRTC: AgoraRTCService,
    public indexService: IndexService
  ) {}

  ngOnDestroy(): void {
    this.indexService.stopVirtualBackground();
  }

  ngOnInit(): void {}

  //create tracks and play localstream
 async allowDevices() {
   await this.agoraRTC.createBothTracks().then(() => {
      this.agoraRTC.streaming.next(true);
      this.agoraRTC.join(this.id).then(() => {
        // this.agoraRTC.publish();
      });
    });

    if (this.agoraRTC.publisher.tracks.video) {
      this.allowDevice = false;
      console.log(this.agoraRTC.publisher.tracks);
      setTimeout(() => {
        this.agoraRTC.publisher.tracks.video?.play('stream');
        const a = document.getElementById('video');
        a ? (a.style.display = 'none') : null;
      }, 1000);
    }
  }


  //select background and apply it on stream
  async selectBackgroundImage(imag: number, type: any) {
    if (this.selectedFlag) {
      await this.indexService.stopVirtualBackground();
    }
    this.selectedFlag = true;
    this.loading_flag = true;
    if (!this.selectedImage) {
      setTimeout(() => {
        const a = document.getElementById('stream');
        a ? (a.style.display = 'none') : null;

        const b = document.getElementById('video');
        b ? (b.style.display = 'block') : null;
      }, 500);
    }
    this.imageName = imag;
    if (type === 'image') {
      this.selectedImage = imag + '.png';
      this.track = await this.indexService.setVirtualBackground(
        {
          sourceType: 'image',
          sourceValue: '../../assets/' + this.selectedImage,
        },
        this.agoraRTC.publisher.tracks.video._mediaStreamTrack
      );
    } else {
      this.selectedImage = '';
      this.track = await this.indexService.setVirtualBackground(
        { sourceType: 'blur', sourceValue: `${this.imageName}` },
        this.agoraRTC.publisher.tracks.video._mediaStreamTrack
      );
    }
    const mediaStream = new MediaStream([this.track]);
    this.video = this.viewChild.nativeElement;
    this.mediaStream = mediaStream;
    this.video.srcObject = mediaStream;
    this.loading_flag = false;
    var playPromise = this.video.play();

    if (playPromise !== undefined) {
      playPromise
        .then((_: any) => {
          // Automatic playback started!
          // Show playing UI.
        })
        .catch((error: any) => {
          // Auto-play was prevented
          // Show paused UI.
        });
    }
  }

  //remove background
  async removeBackground() {
    this.selectedImage = '';
    this.imageName = '';
    this.selectedFlag = false;

    const a = document.getElementById('stream');
    a ? (a.style.display = 'block') : null;
    const b = document.getElementById('video');
    b ? (b.style.display = 'none') : null;
    await this.indexService.stopVirtualBackground();
  }


  //camera on and off 
  async pauseVideo() {
    this.isStreamplay = !this.isStreamplay;
    await this.agoraRTC.publisher.tracks.video.setEnabled(this.isStreamplay);

    if (this.imageName && this.isStreamplay && this.selectedFlag) {
      await this.indexService.stopVirtualBackground();
      if (this.imageName === 20)
        await this.selectBackgroundImage(this.imageName, 'blur');
      else await this.selectBackgroundImage(this.imageName, 'image');
    }
  }
}
