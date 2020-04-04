import { setupCamera, loadVideo, detectPoseInRealTime, calibrate, timer, saveLogToFile, countReps, setScaler } from './utils.js'

import { drawKeypoints, drawSkeleton, plotxy, drawVideo, drawEverything } from './draw.js'

import {
    videoHeight, videoWidth, selectedPartToTrack, parts, framesEvalsToTrack, dataStore, movement,
    movement_kf, calibrationDone, timerClock, modifyDoCalibrate, modifyDoEval, doEval, modifyCalibrationDone
} from './config.js'




function exerciseSpecific(video, ctx, keypoints, minPartConfidence, width, height, calibrationParts) {
    if (doEval) {
        drawVideo(video, ctx);
        drawKeypoints(keypoints, minPartConfidence, ctx);
        drawSkeleton(keypoints, minPartConfidence, ctx);

        let calibrationPosition = calibrationParts;


        calibrate(keypoints, minPartConfidence, calibrationPosition);
    }
    else {
        drawVideo(video, ctx);
    }


}



async function bindPage(calibrationParts) {


    let video;
    video = await loadVideo();


    const canvas = document.getElementById('output');
    const ctx = canvas.getContext('2d');

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const drawInterval = setInterval(function () {
        drawVideo(video, ctx);
    }, 50);


    $('#start-eval').toggleClass('disabled');

    $('#start-eval').click(async function () {
        $('#start-eval').hide();

        console.log("Downloading the Model")


        // const net = await posenet.load({
        //     architecture: 'ResNet50',
        //     outputStride: 32,
        //     inputResolution: { width: 257, height: 200 },
        //     quantBytes: 2
        // });
        
        const net = await posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 640, height: 480 },
            multiplier: 0.75,
            quantBytes: 2
        });

        console.log("Model Downloaded.")

        $('#calibrate').toggleClass('disabled');
        $('#calibrate').click(function () {
            
            modifyDoCalibrate(true);
            // $('#eval-button-container').hide();
            $('#calibrate').hide();
            // $('#part-buttons').show();
            // $('#timer').show();
            $('#post-calibrate').show();
            setTimeout(()=>{
                setScaler();
                dataStore.length = 0;
                timer();
                countReps();
                $('#pause').toggleClass('disabled');
                $('#save').toggleClass('disabled');

            },3000)
            




        });

        $('#pause').click(function () {
            modifyDoEval();
            modifyCalibrationDone(false);
        });

        $('#save').click(function () {
            saveLogToFile();
            console.save(dataStore, "log.json");
        });



        clearInterval(drawInterval);
        detectPoseInRealTime(video, net, exerciseSpecific, calibrationParts);

        $('.debug-part-select').click(function () {
            selectedPartToTrack = $(this).attr('data-key');
        })
    })



}

$('#start-video').click(function () {
    const exerciseID = parseInt(new URLSearchParams(window.location.search).get('exID'));

    let exercise = firebase.database().ref('exercises').once('value', (snapshot) => {
        snapshot.val().map(d => {
            if (d.id === exerciseID) {
                console.log(d);




                $('#video-button-container').hide();
                $('#output').show();
                bindPage(d.calibrationParts);
            }
        })
    });


})


// i=0
// data_out = []
// for (j=0; j < 17; j++) {
//   data_out.push([dataStore[i].keypoints[j].position.x, dataStore[i].keypoints[j].position.y, dataStore[i].keypoints[j].score]);
// }
// for(i=0;i<data_out.length; i++){console.log("[ ", data_out[i][0],", ", data_out[i][1], ", ", data_out[i][2], " ],");}
