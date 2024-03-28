document.addEventListener("DOMContentLoaded", function() {
    // Variable declarations
    var audioCtx;
    var analyser;
    var sources = {};
    var currentAudioId = null;

 
    function createAudioContext() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.connect(audioCtx.destination);
    }


    function stopDiskRotation() {
        disk.classList.remove("rotate");
    }
   

    // Function to play or synchronize audio
    function playOrSyncAudio(elementId) {
        var audioSrc;
        switch (elementId) {
            case "pc1":
                audioSrc = "audios/NEFFEX__Desperate_mastered.mp3";
                break;
            case "pc2":
                audioSrc = "audios/Drums.mp3";
                break;
            case "pc3":
                audioSrc = "audios/Bass.mp3";
                break;
            case "pc4":
                audioSrc = "audios/Fx.mp3";
                break;
            default:
                audioSrc = "audios/default.mp3";
        }

        if (!audioCtx) {
            createAudioContext();
        }

        if (!sources[elementId]) {
            var audio = new Audio(audioSrc);
            var source = audioCtx.createMediaElementSource(audio);
            sources[elementId] = { audio: audio, source: source };
            source.connect(analyser);
            audio.play();
            currentAudioId = elementId;
        } else {
            var syncedSources = Object.values(sources);
            syncedSources.forEach(function(syncedSource) {
                var currentTime = syncedSource.audio.currentTime;
                syncedSource.audio.src = audioSrc;
                syncedSource.audio.currentTime = currentTime;
                if (!syncedSource.audio.paused) {
                    syncedSource.audio.play();
                }
            });
            currentAudioId = elementId;
        }

        startVisualizer();
    }

    // Function to start visualizer
    function startVisualizer() {
        analyser.fftSize = 256;
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);

        function draw() {
            var canvas = document.getElementById("audioVisualizer");
            var ctx = canvas.getContext("2d");
            var WIDTH = canvas.width;
            var HEIGHT = canvas.height;

            // Create gradient
            var gradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
            gradient.addColorStop(0, 'yellow');
            gradient.addColorStop(1, 'red');

            requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, WIDTH, HEIGHT);

            var barHeight;
            var barWidth = WIDTH / bufferLength;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] * 0.4; // Adjust the multiplier to control the wave amplitude

                ctx.fillStyle = gradient; // Set the gradient as fill style
                ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight * 2); // Adjusted for horizontal visualizer

                x += barWidth + 1;
            }
        }

        draw();
        disk.classList.add("rotate");
    }

    // Event listeners for draggable elements
    var drops = document.querySelectorAll(".drops");
    drops.forEach(function(drop) {
        drop.addEventListener("dragstart", function(event) {
            event.dataTransfer.setData("text", event.target.id);
        });
    });

    // Event listeners for dropzones
    var dropzones = document.querySelectorAll(".dropzone");
    dropzones.forEach(function(dropzone) {
        dropzone.addEventListener("dragover", function(event) {
            event.preventDefault();
        });

        dropzone.addEventListener("drop", function(event) {
            event.preventDefault();
            var droppedElementId = event.dataTransfer.getData("text");
            var droppedElement = document.getElementById(droppedElementId);
            if (droppedElement && droppedElement.classList.contains("drops")) {
                droppedElement.style.position = "static";
                droppedElement.style.width = dropzone.offsetWidth + "px";
                droppedElement.style.height = dropzone.offsetHeight + "px";
                dropzone.appendChild(droppedElement);
                playOrSyncAudio(droppedElementId);
            }
        });
    });

    // Power button event listener
    var power = document.getElementById("power");
    power.addEventListener("click", function() {
        Object.values(sources).forEach(function(source) {
            source.audio.pause();
        });

        stopDiskRotation();
    });

    // Dial rotation event listener
    var dial = document.getElementById("dial");
    var dialRotation = 0;
    dial.addEventListener("mousedown", function(event) {
        var dialStartAngle = getAngle(event);
        document.addEventListener("mousemove", handleDialRotation);
        document.addEventListener("mouseup", stopDialRotation);

        function handleDialRotation(event) {
            var currentAngle = getAngle(event);
            var angleDiff = currentAngle - dialStartAngle;
            dialRotation += angleDiff;
            dial.style.transform = `rotate(${dialRotation}deg)`;
            var playbackRate = 1 + (dialRotation / 360);
            Object.values(sources).forEach(function(source) {
                if (isFinite(playbackRate)) {
                    source.audio.playbackRate = playbackRate;
                }
            });
            dialStartAngle = currentAngle;
        }

        function stopDialRotation() {
            document.removeEventListener("mousemove", handleDialRotation);
            document.removeEventListener("mouseup", stopDialRotation);
        }
    });

    // Function to calculate angle
    function getAngle(event) {
        const rect = dial.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const angle = Math.atan2(y - rect.height / 2, x - rect.width / 2);
        return angle;
    }
});
