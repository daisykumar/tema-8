      // Store reference to the div element, create a rotate counter and null startTime
      // and create an uninitialized variable to store the requestAnimationFrame() call in
      const spinner = document.querySelector('div');
      let rotateCount = 0;
      let startTime = null;
      let rAF;

      // Create a draw() function
      function draw(timestamp) {
        if(!startTime) {
         startTime = timestamp;
        }

        rotateCount = (timestamp - startTime) / 3;
        
        // If rotateCount gets over 359, set it to 'remainder of dividing by 360'
        if(rotateCount > 359) {
          rotateCount %= 360;
        }

        // Set the rotation of the div to be equal to rotateCount degrees
        spinner.style.transform = 'rotate(' + rotateCount + 'deg)';
       
        // Call the next frame in the animation
        rAF = requestAnimationFrame(draw);
      }

      draw();
