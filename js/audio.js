document.addEventListener("DOMContentLoaded", function() {
    // Get the dial image
    var dial = document.getElementById("dial");
    var disk = document.getElementById("disk"); // Get the rotating disk element

    // Create AudioContext and related objects
    var audioCtx = new (window.AudioContext || window.AudioContext)();
    var analyser = audioCtx.createAnalyser();
    var sources = {}; // Object to store audio sources
    var currentAudioId = null; // ID of the currently playing audio source

    // Function to play or synchronize the audio track
    function playOrSyncAudio(elementId) {
        var audioSrc;

        // Define audio source based on the dropped element
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
                // Default audio track if the element ID doesn't match
                audioSrc = "audios/default.mp3";
        }

        // Pause the currently playing audio if any
        if (currentAudioId && sources[currentAudioId]) {
            sources[currentAudioId].audio.pause();
        }

        // Create a new audio element and source if not already created
        if (!sources[elementId]) {
            var audio = new Audio(audioSrc);
            var source = audioCtx.createMediaElementSource(audio);
            sources[elementId] = { audio: audio, source: source };

            // Connect audio source to analyzer and destination
            source.connect(analyser);
            analyser.connect(audioCtx.destination);

            // Start playing the audio
            audio.play();
            currentAudioId = elementId;
        } else {
            // Audio source already exists, sync with other sources
            var syncedSources = Object.values(sources);
            syncedSources.forEach(function(syncedSource) {
                // Get the current audio time of each source and synchronize them
                var currentTime = syncedSource.audio.currentTime;
                syncedSource.audio.src = audioSrc;
                syncedSource.audio.currentTime = currentTime;
                // Check if the audio is playing, if so, play it
                if (!syncedSource.audio.paused) {
                    syncedSource.audio.play();
                }
            });
            currentAudioId = elementId;
        }

        // Start visualizer
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

    // Function to stop disk rotation
    function stopDiskRotation() {
        disk.classList.remove("rotate");
    }

    function removeDroppedElement(elementId) {
        var droppedElement = document.getElementById(elementId);
        if (droppedElement && droppedElement.parentNode.classList.contains("dropzone")) {
            droppedElement.parentNode.removeChild(droppedElement);
            if (sources[elementId]) {
                sources[elementId].audio.pause();
                delete sources[elementId];
                var index = currentAudioIds.indexOf(elementId);
                if (index !== -1) {
                    currentAudioIds.splice(index, 1);
                }
            }
        }
    }
    
    // Add event listeners for PNG elements to trigger dragging
    var drops = document.querySelectorAll(".drops");
    drops.forEach(function(drop) {
        drop.addEventListener("dragstart", function(event) {
            event.dataTransfer.setData("text", event.target.id);
        });
    });

    // Add event listeners for dropzones to handle dropping
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
                // Remove position absolute property from the dropped element
                droppedElement.style.position = "static";
                // Match height and width with the dropzone
                droppedElement.style.width = dropzone.offsetWidth + "px";
                droppedElement.style.height = dropzone.offsetHeight + "px";
                // Append the dropped element to the dropzone
                dropzone.appendChild(droppedElement);

                // Play or synchronize the audio track
                playOrSyncAudio(droppedElementId);
            }
        });
    });

    // Pause the audio when the power button is clicked
    var power = document.getElementById("power");
    power.addEventListener("click", function() {
        var allAudio = Object.values(sources).map(function(source) {
            return source.audio;
        });
        allAudio.forEach(function(audio) {
            audio.pause();
        });

        console.log("Music stopped");

        // Stop disk rotation when power button is clicked
        stopDiskRotation();
    });

    // Add event listener for dial rotation
    var dialRotation = 0;
    var dialStartAngle = 0;
    dial.addEventListener("mousedown", function(event) {
        dialStartAngle = getAngle(event);
        document.addEventListener("mousemove", handleDialRotation);
        document.addEventListener("mouseup", stopDialRotation);
    });

    function handleDialRotation(event) {
        var currentAngle = getAngle(event);
        var angleDiff = currentAngle - dialStartAngle;
        dialRotation += angleDiff;
        dial.style.transform = `rotate(${dialRotation}deg)`;

        // Adjust audio playback rate based on dial rotation
        var playbackRate = 1 + (dialRotation / 360); // Adjust multiplier as needed
        Object.values(sources).forEach(function(source) {
            if (source.audio.playbackRate === playbackRate) return;
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

    // Function to calculate angle
    function getAngle(event) {
        const rect = dial.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const angle = Math.atan2(y - rect.height / 2, x - rect.width / 2);
        return angle;
    }
});
