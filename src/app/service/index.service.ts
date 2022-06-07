import { Injectable } from '@angular/core';
import { IBackgroundConfig, VIRTUAL_BACKGROUND_TYPE } from '../interface/global.interface';
// import { Logger } from '../Logger';
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation"
// import MyWorker from "./selfie-segemantation.worker";

@Injectable({
  providedIn: 'root'
})
export class IndexService {
  selfieSegmentation!: any;
  backgroundConfig!: IBackgroundConfig;
  backgroundBlurLevel: any = 5;
  videoElement!: HTMLVideoElement | undefined;
  canvasElement: any;
  image: any;
  worker!: any;
  canvasCtx!: any;
  isSegmentationRunning = false;
  isBackgroundSourceLoading = false;

  constructor() {
    this.selfieSegmentation = new SelfieSegmentation({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      },
    });
    this.selfieSegmentation.setOptions({
      modelSelection: 1,
      effect: 'mask',
    });
    this.selfieSegmentation.onResults(this.onResults.bind(this));
    this.canvasElement = document.createElement('canvas');
    this.canvasCtx = this.canvasElement.getContext('2d');
    this.image = new Image();
    this.image.crossOrigin = 'anonymous';
  }
  private isSupported = () => {
    //support chrome, firefox, edge TODO: check this
    return (
      navigator.userAgent.indexOf('Chrome') != -1 ||
      navigator.userAgent.indexOf('Firefox') != -1 ||
      navigator.userAgent.indexOf('Edg') != -1
    );
  };

  
  public setVirtualBackground = async (
    backgroundConfig: IBackgroundConfig,
    track?: MediaStreamTrack,
  ): Promise<any> => {
    if (this.isSupported()) {
      try {
        await this.setBackground(backgroundConfig);
        if (!this.isSegmentationRunning && track) {
          await this.initialiseSegmentation(track);
          return this.canvasElement.captureStream(15).getVideoTracks()[0];
        }
      } catch (error: any) {
        console.log('error', error);
        throw new Error(error.message as string);
      }
    } else {
      throw new Error('You Browser does not support Virtual Background');
    }
  };


  private initialiseSegmentation = async (track: MediaStreamTrack): Promise<void> => {
    await this.registerWebWorker();
    await this.selfieSegmentation.initialize();
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.srcObject = track ? new MediaStream([track]) : null;
    try {
      await this.videoElement.play();
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
      this.worker.postMessage({
        action: 'initialize',
        maxFPS: 22,
      });
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        // logger.warn('detected video element autoplay failed');
      }
      throw new Error(error.message);
    }
  };

  /**
   * This function start or register web worker if worker is not register yet
   * and listen for event 'segmentframe' and call segmentFrame method
   */
  private registerWebWorker = () => {
    if (typeof Worker !== 'undefined' && this.worker === undefined) {
      // Create a new
      // this.worker = new MyWorker();
        this.worker = new Worker(
    new URL('./selfie-segemantation.worker', import.meta.url)
  );
      this.isSegmentationRunning = true;
      this.worker.onmessage = ({ data }: any) => {
        if (data.action == 'segmentframe') {
          this.segmentFrame();
        }
      };
      // worker.postMessage('hello');
    } else {
      // Web Workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  };

  /**
   * This function call every frame currently 22 times per sec
   * in these function first we check that height and width of video element is not 0
   * which give error by selfieSegmentation library
   * if segmentation possible then we call send method of S.s which take videElement as a image
   */
  private segmentFrame = async () => {
    if (!this.isSegmentPossible()) {
      return;
    }
    await this.selfieSegmentation.send({
      image: this.videoElement,
    });
  };

  /**
   * This function help us to check weather segmentation is possible
   * first it check for video Element size or is background load
   */
  private isSegmentPossible = () => {
    if (
      this.videoElement &&
      (this.videoElement.videoWidth <= 0 || this.videoElement.videoHeight <= 0 || !this.isBackgroundSourceLoading)
    ) {
      return false;
    } else {
      return true;
    }
  };

  /**
   * This function call by Segmentation library for every frame
   * the @argument is result which include segmentationMask and segmentationResult
   * first we need to draw the segmentation mask on canvas
   * after that based on background type we call particular handler
   */
  private onResults = (results: any) => {
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.canvasCtx.drawImage(results.segmentationMask, 0, 0, this.canvasElement.width, this.canvasElement.height);
    if (this.backgroundConfig.sourceType === 'image') {
      this.drawImageBackground(results);
    } else if (this.backgroundConfig.sourceType === 'blur') {
      this.drawBlurBackground(results);
    }
    this.canvasCtx.restore();
  };

  /**
   * This function call by client to set background
   * It  take IBackgroundConfig as @argument which has sourceType and sourceValue
   * based on sourceType we set src the background on particular tag
   * and at last we check if Segmentation is not running then we start the worker and and Segmentation
   */
  private setBackground = async (backgroundConfig: IBackgroundConfig) => {
    this.backgroundConfig = { ...backgroundConfig };
    this.isBackgroundSourceLoading = false;
    switch (backgroundConfig.sourceType) {
      case VIRTUAL_BACKGROUND_TYPE.IMAGE:
        await this.load(backgroundConfig.sourceValue);
        this.isBackgroundSourceLoading = true;
        break;
      case VIRTUAL_BACKGROUND_TYPE.BLUR:
        this.backgroundBlurLevel = this.backgroundConfig.sourceValue;
        this.isBackgroundSourceLoading = true;
        break;
      default:
        break;
    }
  };

  private load = (url: string) =>
    new Promise(resolve => {
      this.image.onload = () => {
        resolve(url);
      };
      this.image.src = url;
    });

  private drawImageBackground = (results: any) => {
    this.canvasCtx.globalCompositeOperation = 'source-out';
    this.canvasCtx.drawImage(this.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
    this.canvasCtx.globalCompositeOperation = 'destination-atop';
    this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
  };

  /**
   * This function run for every frame and background type is blur
   * first we draw blur of background on canvas via 'source-out' operation
   * then we draw foreground results.image on canvas via 'destination-atop' operation
   */
  private drawBlurBackground = (results: any) => {
    this.canvasCtx.globalCompositeOperation = 'source-out';
    this.canvasCtx.filter = `blur(${this.backgroundConfig.sourceValue}px)`;
    this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
    this.canvasCtx.globalCompositeOperation = 'destination-atop';
    this.canvasCtx.filter = 'none';
    this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
  };


  /**
   * This function call unregisterWebworker method
   */
  public stopVirtualBackground = () => {
    this.unregisterWebWorker();
  };

  /**
   * This function unregister web worker
   */
  private unregisterWebWorker = () => {
    if (this.worker !== undefined) {
      this.worker.terminate();
      this.videoElement?.remove();
      this.videoElement = undefined;
      this.isSegmentationRunning = false;
      this.worker = undefined;
    }
  };
}

