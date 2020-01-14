import { videoHeight, videoWidth, selectedPartToTrack, parts, framesEvalsToTrack, dataStore, movement, movement_kf, calibrationDone, doCalibrate, modifyCalibrationDone, timerClock, modifyTimerClock } from './config.js'
import { drawKeypoints, drawSkeleton, plotxy, drawVideo } from './draw.js'


export function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

export function timer(){
    setInterval(() => {
        if (calibrationDone){
            timerClock.s++;
            if (timerClock.s>=60){
                timerClock.s=0;
                timerClock.m++;
                if (timerClock.m>=60){
                    timerClock.s=0;
                    timerClock.m=0;
                    timerClock.h++;
                }

            }
            modifyTimerClock(timerClock.h,timerClock.m,timerClock.s);
        }
        console.log(timerClock);
    }, 1000);
}


export function calibrate(keypoints, minPartConfidence, calibrationPosition) {
    // console.log('Do calibrate : ', doCalibrate, "Calibration Done", calibrationDone);

    if (doCalibrate) {
        let calibrationState = calibrationPosition.map(()=>(0));
        calibrationPosition.forEach((index) => {
            $('.label[data-key="' + index + '"]').show();
            $('.x[data-key="' + index + '"]').show();
        })
        keypoints.forEach((pt, i) => {
            if (calibrationPosition.indexOf(i)>=0){
                if (pt.score >= minPartConfidence) {
                    calibrationState[i] = 1;
                    $('.x[data-key="' + i + '"]').hide();
                    $('.check[data-key="' + i + '"]').show();
                }
                else {
                    calibrationState[i] = 0;
                    $('.x[data-key="' + i + '"]').show();
                    $('.check[data-key="' + i + '"]').hide();
                }
            }
            
        });
        // console.log(calibrationState.reduce((b,c)=>(b+c),0), calibrationPosition.length);
        if (calibrationState.reduce((b,c)=>(b+c),0)==calibrationPosition.length){
            modifyCalibrationDone(true);
        }
        else{
            modifyCalibrationDone(false);
        }

    }
}



export async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available');
    }

    var video = document.querySelector("#videoElement");
    video.width = videoWidth;
    video.height = videoHeight;

    const stream = await navigator.mediaDevices.getUserMedia({
        'video': true
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

export async function loadVideo() {
    const video = await setupCamera();
    video.play();

    return video;
}

export function detectPoseInRealTime(video, net, func) {
    var kf = new KalmanFilter();

    const minPoseConfidence = 0.1;
    const minPartConfidence = 0.5;


    const canvas = document.getElementById('output');
    const ctx = canvas.getContext('2d');

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    async function poseDetectionFrame() {
        let poses = [];
        const pose = await net.estimatePoses(video, {
            flipHorizontal: true,
            decodingMethod: 'single-person'
        });
        poses = poses.concat(pose);

        if (movement.length < 20) {
            movement.push(pose[0].keypoints[selectedPartToTrack].position.y);
            movement_kf.push(kf.filter(pose[0].keypoints[selectedPartToTrack].position.y));
        }
        else {
            movement.shift();
            movement_kf.push(kf.filter(pose[0].keypoints[selectedPartToTrack].position.y));
        }

        if (dataStore.length < framesEvalsToTrack) {
            dataStore.push(pose[0]);
        }
        else {
            dataStore.shift();
            dataStore.push(pose[0]);
        }




        poses.forEach(({ score, keypoints }) => {
            if (score >= minPoseConfidence) {

                func(video, ctx, keypoints, minPartConfidence, 400, 450);

            }
        });

        // End monitoring code for frames per second

        requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();
}

