document.addEventListener("DOMContentLoaded", function() {
  var dial = document.getElementById("dial");
  var isMouseDown = false;
  var previousAngle = 0;
  var initialRotation = 0;
  var audio = document.getElementById("audioEl");

  // Function to calculate angle between two points
  function getAngle(x1, y1, x2, y2) {
      var angle = Math.atan2(y1 - y2, x1 - x2);
      return angle * (180 / Math.PI);
  }

  dial.addEventListener("mousedown", function(event) {
      isMouseDown = true;
      var startX = event.clientX;
      var startY = event.clientY;
    
      var dialRect = dial.getBoundingClientRect();
      var centerX = dialRect.left + dialRect.width / 2;
      var centerY = dialRect.top + dialRect.height / 2;
    
      initialRotation = getRotation(dial.style.transform);
      previousAngle = getAngle(startX, startY, centerX, centerY) - initialRotation;
    
      document.addEventListener("mousemove", rotateDial);
  });

  document.addEventListener("mouseup", function() {
      isMouseDown = false;
      document.removeEventListener("mousemove", rotateDial);
  });

  function rotateDial(event) {
      if (isMouseDown) {
          var currentX = event.clientX;
          var currentY = event.clientY;
        
          var dialRect = dial.getBoundingClientRect();
          var centerX = dialRect.left + dialRect.width / 2;
          var centerY = dialRect.top + dialRect.height / 2;
        
          var currentAngle = getAngle(currentX, currentY, centerX, centerY);
          var rotation = currentAngle - previousAngle;
          var newRotation = initialRotation + rotation;
        
          dial.style.transform = "rotate(" + newRotation + "deg)";
        
          // Adjust audio volume based on rotation angle thresholds
          if (newRotation >= 120 || newRotation <= -120) {
              // Map the rotation angle to volume range (0 to 1)
              audio.volume = Math.max(0, Math.min(1, (newRotation + 120) / 240));
          }
      }
  }

  // Function to extract rotation value from transform string
  function getRotation(transformValue) {
      var match = transformValue.match(/rotate\(([-]?\d+)deg\)/);
      return match ? parseInt(match[1]) : 0;
  }
});
