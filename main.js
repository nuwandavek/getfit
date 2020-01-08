
const videoWidth = 600;
const videoHeight = 450;

const dataStore = [];

function drawKeypoints(keypoints, minPartConfidence, ctx) {
    keypoints.forEach((pt) => {
        // console.log(pt);
        if (pt.score >= minPartConfidence) {
            ctx.beginPath();
            ctx.arc(pt.position.x, pt.position.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
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


function plotxy() {

    console.log(dataStore);
    const svg = d3.select('#plot').attr('width', 250).attr('height', 450);

    var xScale = d3.scaleLinear()
        .domain([0, 10 - 1]) // input
        .range([50, 250]); // output


    var yScale1 = d3.scaleLinear()
        .domain([0, 500]) // input 
        .range([200, 0]); // output 


    var yScale2 = d3.scaleLinear()
        .domain([0, 500]) // input 
        .range([400, 200]); // output 


    var line1 = d3.line()
        .x(function (d, i) { return xScale(i); }) // set the x values for the line generator
        .y(function (d) { return yScale1(d.keypoints[0].position.x); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    var line2 = d3.line()
        .x(function (d, i) { return xScale(i); }) // set the x values for the line generator
        .y(function (d) { return yScale2(d.keypoints[0].position.y); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    d3.select('#xplot').remove();
    d3.select('#yplot').remove();
    const gX = svg.append('g').attr('id', 'xplot');
    const gY = svg.append('g').attr('id', 'yplot');


    gX.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + 200 + ")")
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
        .attr("cy", function (d) { return yScale1(d.keypoints[0].position.x) })
        .attr("r", 5)

    gX.append('text').attr('x',150).attr('y',20).attr('text-anchor','middle').attr('fill','#fff').text('X of Nose');
    gY.append('text').attr('x',150).attr('y',270).attr('text-anchor','middle').attr('fill','#fff').text('Y of Nose');


    gY.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + 400 + ")")
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
        .attr("cy", function (d) { return yScale2(d.keypoints[0].position.y) })
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

        if (dataStore.length < 10) {
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
                plotxy();

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




    console.log("Downloading the Model")


    const net = await posenet.load({
        architecture: 'ResNet50',
        outputStride: 32,
        inputResolution: { width: 257, height: 200 },
        quantBytes: 2
    });

    console.log("Model Downloaded.")


    detectPoseInRealTime(video, net);





}


bindPage();