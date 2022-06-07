export interface IBackgroundConfig {
    sourceType: 'blur'|'image' | 'none';
    sourceValue: string;
}
export enum VIRTUAL_BACKGROUND_TYPE {
    NONE='none',
    BLUR='blur',
    IMAGE='image',
  }