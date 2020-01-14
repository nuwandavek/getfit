import {pad} from './utils.js'


export const videoWidth = 600;
export const videoHeight = 450;


export let selectedPartToTrack = 0;
export const framesEvalsToTrack = 20;
export const parts = ["nose", "leftEye", "rightEye", "leftEar", "rightEar", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee", "leftAnkle", "rightAnkle"];

export const dataStore = [];
export const movement = [];
export const movement_kf = [];


export var calibrationDone = false;
export function modifyCalibrationDone( value ) { calibrationDone = value; }


export var doCalibrate = false;
export function modifyDoCalibrate( value ) { doCalibrate = value; }

export var timerClock = {
    s:0,
    m:0,
    h:0
}
export function modifyTimerClock(h,m,s){
    timerClock = {h,m,s}
    $('#hour').html(pad(h,2));
    $('#min').html(pad(m,2));
    $('#sec').html(pad(s,2)); 
}