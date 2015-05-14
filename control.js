var gamepad = require("gamepad");
var ardrone = require("ar-drone");
var blessed = require("blessed");

var drone = ardrone.createClient();
var screen = blessed.screen({
	autopad: true,
	smartCSR: true,
});
// exit the program by using esc q or ctl-c
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// data boxes that get updated
var cameraStatusBox;
var rollStatusBox;
var pitchStatusBox;
var yawStatusBox;
var xVbox, yVbox, zVbox;
var altBox;
var batteryBox;
var errorBox;

// data bars that get updated
var batteryBar;



drone.on('navdata',getData);
// Initialize the library
gamepad.init();
clearErrors();



// set variables up
var flying = false;
var frontCamera=true;

// Create a game loop and poll for events
setInterval(gamepad.processEvents, 16);
// Scan for new gamepads as a slower rate
setInterval(gamepad.detectDevices, 500);

//clear the window and set it up
initDisplay();

// Listen for move events on all gamepads
gamepad.on("move", function (id, axis, value) {
			if(!flying) return; // don't change controls when not flying
			switch (axis){
			case 0: leftRight(value); break;
			case 1: forwardBack(value);break;
			case 2: upDown(value);break;
			case 3: clockwiseCounterclock(value); break;
			default: warn("Unknown axis"); break;
			}
			});

// Listen for button up events on all gamepads
gamepad.on("up", function (id, num) {
	switch(num){
	case 0: takeOffLand(); break;
	case 1: changeCamera(); break;
	default: warn("Unknown button"); break;
	}
});


// Move to the left and right
function leftRight(amount){
	if(amount<0){
		//console.log("Translating left by %d",-amount);
		drone.left(-amount);
	}
	else{
		//console.log("Translating right by %d",amount);
		drone.right(amount);
	}
}

function upDown(amount){
	if(Math.abs(amount)<0.1) return; // get rid of any noise
	if(amount>0){
		//console.log("Going down by %d",amount);
		drone.down(amount);
	}
	else{
		//console.log("Going up by %d",-amount);
		drone.up(-amount);
	}
}

function forwardBack(amount){
	if(amount>0){
		//console.log("Going back by %d",amount);
		drone.back(amount);
	}
	else{
		//console.log("Going forward by %d",-amount);
		drone.front(-amount);
	}
}

function clockwiseCounterclock(amount){
	if(amount>0){
		//console.log("Rotating right by %d",amount);
		drone.clockwise(amount);
	}
	else{
		//console.log("Rotating left by %d",-amount);
		drone.counterClockwise(-amount);
	}
}

function takeOffLand(){
	if(flying){
		console.log("Landing");
		flying = false;
		drone.land();
	}
	else{
		console.log("Taking off");
		flying = true;
		drone.takeoff();
	}
}

function changeCamera(){
	if(frontCamera){
		cameraStatusBox.setContent("Camera facing downwards");
		frontCamera=false;
		drone.config('video:video_channel',3);
	}
	else{
		cameraStatusBox.setContent("Camera facing forward");
		frontCamera=true;
		drone.config('video:video_channel',0);
	}
	screen.render();
}

function getData(val){
	if(val.demo != null){
		var helper = val.demo;
		
		// Battery
		var str = helper.batteryPercentage;
		str = str + "%";
		batteryBox.setContent(str);
		
		// Velocity
		xVbox.setContent(helper.xVelocity);
		yVbox.setContent(helper.yVelocity);
		zVbox.setContent(helper.zVelocity);

		// Rotation

		str = "" + helper.leftRightDegrees;
		rollStatusBox.setContent(str);
		str = "" + helper.frontBackDegrees;
		pitchStatusBox.setContent(str);
		str = "" + helper.clockwiseDegrees;
		yawStatusBox.setContent(str);


		// Render the screen
		screen.render();
	}
}

function initDisplay(){

// camera status window
	var cameraMaster= blessed.box({
		top: 40,
		left: 40,
		width: 26,
		height: 4,
		tags: true,
		border: {
			type: 'line'
		},
		style: {
			border: {
					fg: '#ffffff'
			}
		}
	});

// Rotation window
	var rotationMaster= blessed.box({
		top: 10,
		left: 20,
		width: 23,
		height: 6,
		tags: true,
		border: {
			type: 'line'
		},
		style: {
			border: {
					fg: '#ffffff'
			}
		}
	});

// Velocity window
	var velocityMaster= blessed.box({
		top: 10,
		left: 50,
		width: 15,
		height: 6,
		tags: true,
		border: {
			type: 'line'
		},
		style: {
			border: {
					fg: '#ffffff'
			}
		}
	});

// Battery window
	var batteryMaster= blessed.box({
		top: 20,
		left: 50,
		width: 10,
		height: 4,
		tags: true,
		border: {
			type: 'line'
		},
		style: {
			border: {
					fg: '#ffffff'
			}
		}
	});

// Progress bar
	var barThing = blessed.ProgressBar({
		top: 4,
		left: 8,
		width: 10,
		height: 4,
		filled: 50,
		style: {
			bar: {
					fg: '#ffffff'
			}
		}
	});

addRoll(rotationMaster);
addCamera(cameraMaster);
addSpeed(velocityMaster);
addBattery(batteryMaster);

screen.append(rotationMaster);
screen.append(cameraMaster);
screen.append(velocityMaster);
screen.append(batteryMaster);
screen.append(barThing);

// Render the screen.
screen.render();
}

// add in rotation information
function addRoll(rotationMaster){
	var titleRotation = blessed.text({
	  top: 0,
	  left: 2,
	  width: 15,
	  height: 1,
	  content: '{bold}Rotation (deg){/bold}',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
	var yawTitle = blessed.text({
	  top:  1,
	  left: 0,
	  width: 4,
	  height: 1,
	  content: 'Yaw:',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
	var rollTitle = blessed.text({
	  top:  2,
	  left: 0,
	  width: 5,
	  height: 1,
	  content: 'Roll:',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
	var pitchTitle = blessed.text({
	  top:  3,
	  left: 0,
	  width: 6,
	  height: 1,
	  content: 'Pitch:',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
	yawStatusBox= blessed.text({
	  top:  1,
	  left: 9,
	  width: 7,
	  height: 1,
	  content: '0.0000',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
	rollStatusBox= blessed.text({
	  top:  2,
	  left: 9,
	  width: 7,
	  height: 1,
	  content: '0.0000',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
	pitchStatusBox= blessed.text({
	  top:  3,
	  left: 9,
	  width: 7,
	  height: 1,
	  content: '0.000',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
rotationMaster.append(yawTitle);
rotationMaster.append(rollTitle);
rotationMaster.append(pitchTitle);
rotationMaster.append(titleRotation);
rotationMaster.append(yawStatusBox);
rotationMaster.append(rollStatusBox);
rotationMaster.append(pitchStatusBox);
}

// add in camera status
function addCamera(cameraMaster){
	var titleCamera= blessed.text({
	  top: 0,
	  left: 8,
	  width: 13,
	  height: 1,
	  content: '{bold}Camera status{/bold}',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
	cameraStatusBox= blessed.text({
	  top:  1,
	  left: 0,
	  width: 24,
	  height: 1,
	  content: 'Camera facing forward',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
cameraMaster.append(cameraStatusBox);
cameraMaster.append(titleCamera);
}

// add in velocity info
function addSpeed(speedMaster){
	var titleSpeed = blessed.text({
	  top: 0,
	  left: 0,
	  width: 8,
	  height: 1,
	  content: '{bold}Velocity{/bold}',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
var vXTitle = blessed.text({
  top:  1,
  left: 0,
  width: 2,
  height: 1,
  content: 'x:',
  tags: true,
  style: {
	fg: 'white',
  }
});
var vYTitle = blessed.text({
  top:  2,
  left: 0,
  width: 2,
  height: 1,
  content: 'y::',
  tags: true,
  style: {
	fg: 'white',
  }
});
var vZTitle = blessed.text({
  top:  3,
  left: 0,
  width: 2,
  height: 1,
  content: 'z::',
  tags: true,
  style: {
	fg: 'white',
  }
});
xVbox= blessed.text({
  top:  1,
  left: 6,
  width: 5,
  height: 1,
  content: '0.0000',
  tags: true,
  style: {
	fg: 'white',
  }
});
yVbox= blessed.text({
  top:  2,
  left: 6,
  width: 5,
  height: 1,
  content: '0.0000',
  tags: true,
  style: {
	fg: 'white',
  }
});
zVbox= blessed.text({
  top:  3,
  left: 6,
  width: 5,
  height: 1,
  content: '0.000',
  tags: true,
  style: {
	fg: 'white',
  }
});
speedMaster.append(titleSpeed);
speedMaster.append(vXTitle);
speedMaster.append(vYTitle);
speedMaster.append(vZTitle);
speedMaster.append(xVbox);
speedMaster.append(yVbox);
speedMaster.append(zVbox);
}

// add in battery status
function addBattery(batteryMaster){
	var titleBattery= blessed.text({
	  top: 0,
	  left: 0,
	  width: 8,
	  height: 1,
	  content: '{bold}Battery{/bold}',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
	batteryBox = blessed.text({
	  top:  1,
	  left: 2,
	  width: 4,
	  height: 1,
	  content: '00%',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
	createBar(0,2,2,batteryBar, horizontal, 20, 50);
batteryMaster.append(batteryBox);
batteryMaster.append(titleBattery);
batteryMaster.append(batteryBar);
}

// Display any errors
function error(val){
	setTimeout(clearErrors, 5000); // clear the error after 5 seconds
	errorBox= blessed.text({
	top:  screen.height-2,
	left: 'center',
	width: 40,
	height: 1,
	content: val,
	tags: true,
	align: 'center',
	style: {
		fg: 'white',
		bg: 'red',
	}
	});
	screen.append(errorBox);
	screen.render();
}

// Display any errors
function warn(val){
	setTimeout(clearErrors, 3000); // clear the error after 5 seconds
	errorBox= blessed.text({
	top:  screen.height-2,
	left: 'center',
	width: 40,
	height: 1,
	content: val,
	tags: true,
	align: 'center',
	style: {
		fg: 'black',
		bg: 'yellow',
	}
	});
	screen.append(errorBox);
	screen.render();
}

// Clear any issues
function clearErrors(){
	errorBox= blessed.text({
	top:  screen.height-2,
	left: 'center',
	width: 40,
	height: 1,
	content: "No current issues",
	tags: true,
	align: 'center',
	style: {
		fg: 'white',
		bg: 'green',
	}
	});
	screen.append(errorBox);
	screen.render();
}

// helper methods to create lines
// red and yellow are the limits to switch to the colors
function createBar(val,x,y,bar,orientation, red,yellow){
	if (val < 0) newBar('red',0,x,y,bar,orientation); // deal with <0 numbers
	if (val < 20){
		newBar('red',val,x,y,bar,orientation);
	}
	else if(val < 70){
		newBar('yellow',val,x,y,bar,orientation);
	}
	else if(val < 100) {
		newBar('green',val,x,y,bar,orientation);
	}
	else{
		newBar('green',100,x,y,bar,orientation);
	}	
}

function newBar(col, val, x, y,bar, orientation){
	var width, height;
	if(orientation == 'horizontal'){
		width = 20;
		height = 5;
	}
	else{
		orientation='vertical';
		width = 5;
		height = 20;
	}
	
	bar= blessed.ProgressBar({
		top: x,
		left: y,
		border: 'line',
		orientation: orientation;
		style: {
			fg: 'black',
			bg: 'black',
			bar: {
				bg: col,
				fg: 'default'
			},
			border: {
				fg: 'default',
				bg: 'black'
			}
		},
		
		width: width
		height: height,
		filled: val,
	});
	screen.append(bar);
}
