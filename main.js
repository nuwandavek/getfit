
const videoWidth = 600;
const videoHeight = 450;

const dataStore = [];
let videoStatus = false;
let modelEvalStatus = false;

let selectedPartToTrack = 0;
const framesEvalsToTrack = 20;
const parts = ["nose", "leftEye", "rightEye", "leftEar", "rightEar", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee", "leftAnkle", "rightAnkle"];

const movement = [];
const movement_kf = [];
var kf = new KalmanFilter();

function drawKeypoints(keypoints, minPartConfidence, ctx) {
    keypoints.forEach((pt) => {
        // console.log(pt);
        if (pt.score >= minPartConfidence) {
            ctx.beginPath();
            ctx.arc(pt.position.x, pt.position.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "#c0392b";
            ctx.fill();
        }


    });
}

function drawVideo(video, ctx) {
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-videoWidth, 0);
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    ctx.restore();

}


function drawSkeleton(keypoints, minPartConfidence, ctx) {
    const edges = [
        { "name": "l-r-shoulder", "points": [5, 6] },
        { "name": "l-r-hip", "points": [11, 12] },
        { "name": "l-shoulder-elbow", "points": [5, 7] },
        { "name": "r-shoulder-elbow", "points": [6, 8] },
        { "name": "l-shoulder-hip", "points": [5, 11] },
        { "name": "r-shoulder-hip", "points": [6, 12] },
        { "name": "l-elbow-wrist", "points": [7, 9] },
        { "name": "r-elbow-wrist", "points": [8, 10] },
        { "name": "l-hip-knee", "points": [11, 13] },
        { "name": "r-hip-knee", "points": [12, 14] },
        { "name": "l-knee-ankle", "points": [13, 15] },
        { "name": "r-knee-ankle", "points": [14, 16] }
    ];

    edges.forEach((edge) => {
        if ((keypoints[edge.points[0]].score >= minPartConfidence) && (keypoints[edge.points[1]].score >= minPartConfidence)) {
            ctx.beginPath();
            ctx.moveTo(keypoints[edge.points[0]].position.x, keypoints[edge.points[0]].position.y);
            ctx.lineTo(keypoints[edge.points[1]].position.x, keypoints[edge.points[1]].position.y);
            ctx.strokeStyle = "#2980b9";
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });

}

function plotxy(width, height) {


    // console.log(dataStore);
    const svg = d3.select('#plot').attr('width', width).attr('height', height);

    var xScale = d3.scaleLinear()
        .domain([0, framesEvalsToTrack - 1]) // input
        .range([50, width]); // output


    var yScale1 = d3.scaleLinear()
        .domain([0, 500]) // input 
        .range([height / 2 - 25, 0]); // output 


    var yScale2 = d3.scaleLinear()
        .domain([0, 500]) // input 
        .range([height - 50, height / 2 - 25]); // output 


    var line1 = d3.line()
        .x(function (d, i) { return xScale(i); }) // set the x values for the line generator
        .y(function (d) { return yScale1(d.keypoints[selectedPartToTrack].position.x); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    var line2 = d3.line()
        .x(function (d, i) { return xScale(i); }) // set the x values for the line generator
        .y(function (d) { return yScale2(d.keypoints[selectedPartToTrack].position.y); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    d3.select('#xplot').remove();
    d3.select('#yplot').remove();
    const gX = svg.append('g').attr('id', 'xplot');
    const gY = svg.append('g').attr('id', 'yplot');


    gX.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height / 2 - 25) + ")")
        .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

    gX.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(yScale1)); // Create an axis component with d3.axisLeft

    gX.append("path")
        .datum(dataStore) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", line1); // 11. Calls the line generator 

    gX.selectAll(".dot")
        .data(dataStore)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", function (d, i) { return xScale(i) })
        .attr("cy", function (d) { return yScale1(d.keypoints[selectedPartToTrack].position.x) })
        .attr("r", 5)

    gX.append('text').attr('x', 150).attr('y', 20).attr('text-anchor', 'middle').attr('fill', '#fff').text('X of ' + parts[selectedPartToTrack]);
    gY.append('text').attr('x', 150).attr('y', 270).attr('text-anchor', 'middle').attr('fill', '#fff').text('Y of ' + parts[selectedPartToTrack]);


    gY.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height - 50) + ")")
        .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

    gY.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(yScale2)); // Create an axis component with d3.axisLeft

    gY.append("path")
        .datum(dataStore) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", line2); // 11. Calls the line generator 

    gY.selectAll(".dot")
        .data(dataStore)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", function (d, i) { return xScale(i) })
        .attr("cy", function (d) { return yScale2(d.keypoints[selectedPartToTrack].position.y) })
        .attr("r", 5)



}

async function setupCamera() {
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

async function loadVideo() {
    const video = await setupCamera();
    video.play();

    return video;
}

function detectPoseInRealTime(video, net) {
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

                drawVideo(video, ctx);
                drawKeypoints(keypoints, minPartConfidence, ctx);
                drawSkeleton(keypoints, minPartConfidence, ctx);
                plotxy(400, 450);

            }
        });

        // End monitoring code for frames per second

        requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();
}


async function bindPage() {

    // var video = document.querySelector("#videoElement");

    // if (navigator.mediaDevices.getUserMedia) {
    //     navigator.mediaDevices.getUserMedia({ video: true })
    //         .then(function (stream) {
    //             video.srcObject = stream;
    //         })
    //         .catch(function (error) {
    //             console.log("Something went wrong!");
    //         });
    // }
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

    $('#start-eval').click(async function() {
        $('#eval-button-container').hide();
        $('#part-buttons').show();
        $('#plot').show();
        console.log("Downloading the Model")


        const net = await posenet.load({
            architecture: 'ResNet50',
            outputStride: 32,
            inputResolution: { width: 257, height: 200 },
            quantBytes: 2
        });

        console.log("Model Downloaded.")

        clearInterval(drawInterval);
        detectPoseInRealTime(video, net);

        $('.debug-part-select').click(function () {
            selectedPartToTrack = $(this).attr('data-key');
        })
    })



}

$('#start-video').click(function () {
    $('#video-button-container').hide();
    $('#output').show();
    bindPage();
})


// i=0
// data_out = []
// for (j=0; j < 17; j++) {
//   data_out.push([dataStore[i].keypoints[j].position.x, dataStore[i].keypoints[j].position.y, dataStore[i].keypoints[j].score]);
// }
// for(i=0;i<data_out.length; i++){console.log("[ ", data_out[i][0],", ", data_out[i][1], ", ", data_out[i][2], " ],");}
