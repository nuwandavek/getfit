import {videoHeight, videoWidth, selectedPartToTrack, parts, framesEvalsToTrack, dataStore, movement, movement_kf} from './config.js'
import {drawKeypoints, drawSkeleton, plotxy, drawVideo} from './draw.js'


export function calibrate(doCalibrate, keypoints, minPartConfidence){
    console.log('Do calibrate : ',doCalibrate);
    if (doCalibrate){
        keypoints.forEach((pt,i) => {
            if (pt.score >= minPartConfidence) {
                $('.x[data-key="'+i+'"]').hide();
                $('.check[data-key="'+i+'"]').show();
            }
            else{
                $('.x[data-key="'+i+'"]').show();
                $('.check[data-key="'+i+'"]').hide();
            }
        });

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

