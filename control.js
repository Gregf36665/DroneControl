var gamepad = require("gamepad");
var ardrone = require("ar-drone");
var blessed = require("blessed");
var debugging = (process.argv[2] == '-d');


if(debugging){
	console.error('debugging active.  Make sure this is being redirected');
}

var drone = ardrone.createClient();
var screen = blessed.screen({
	autopad: true,
	smartCSR: true,
});
// exit the program by using esc q or ctl-c
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// vertical speed (-1 to 1)
var vs = 0;

// data boxes that get updated
var rollStatusBox;
var pitchStatusBox;
var yawStatusBox;
var xVbox, yVbox, zVbox;
var altBox;
var batteryBox;
var errorBox;

//BIP
var panel;

// Master boxes that must be updated
var batteryMaster;
var altMaster;

// bars that are used
var batteryBar;
var altBar;
var vsBar;

// detect information from the drone
drone.on('navdata',getData);
// Initialize the library
gamepad.init();

// set variables up
var flying = false;
var frontCamera=true;
var hovering = false;

// Create a game loop and poll for events
setInterval(gamepad.processEvents, 16);
// Scan for new gamepads as a slower rate
setInterval(gamepad.detectDevices, 500);

// Set the max altitude (in mm)
//drone.config('control:altitude_max',10000);

//clear the window and set it up
initDisplay();

// Display alert if debugging
if(debugging) info('debugging active');

// Check that the drone is connectied
var exec = require('child_process').exec, child;
child = exec('ping -c 1 192.168.1.1', function(errors, stdout, stderr){
		if(errors !== null){
			errorBIP(1,panel);
			commBIP(2,panel);
		}
});

// adjuct vertical speed every second
//setInterval(changeVs, 1000);

// Listen for move events on all gamepads
gamepad.on("move", function (id, axis, value) {
		value /= 2; // reduce sensitivity
			if(!flying){
					warn("Drone landed");
					return; // don't change controls when not flying
			}
			if(hovering){
					warn("Drone hovering");
					return; // don't change controls when hovering
			}
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
	case 2: sosDisable(); break;
	case 3:  hover(); break;
	default: warn("Unknown button"); break;
	}
});

// Disable SOS mode
function sosDisable(){
	errorBIP(0,panel);
	warnBIP(0,panel);
	screen.render();
	drone.disableEmergency();
}
	
// Hover the drone
function hover(){
	if(hovering){
		hovering = false;
		hoverBIP(0,panel);
	}
	else{
		hovering = true;
		drone.stop();
		hoverBIP(1,panel);
	}
}

// Move to the left and right
function leftRight(amount){
	if(amount<0){
		drone.left(-amount);
	}
	else{
		drone.right(amount);
	}
}

// Change the vertials speed
function upDown(amount){
	if(Math.abs(amount-vs)<0.1) return; // get rid of any noise
	vs = amount;
	changeVs();
}

// change the vertical velocity
function changeVs(){
	if(!flying) vs = 0; // set the vertical speed to 0 to get good results
	zVbox.setContent(""+-vs);
	newBarPN(-vs*100,20,90,vsBar,'vertical',20);
	if(vs<0){
		drone.up(-vs);
	}
	else if(vs > 0){
		drone.down(vs);
	}
	else{
		drone.stop();
	}
}

function forwardBack(amount){
	if(amount>0){
		drone.back(amount);
	}
	else{
		drone.front(-amount);
	}
}

function clockwiseCounterclock(amount){
	if(amount>0){
		drone.clockwise(amount);
	}
	else{
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
		cameraBIP(1,panel);
		frontCamera=false;
		drone.config('video:video_channel',3);
	}
	else{
		cameraBIP(0,panel);
		frontCamera=true;
		drone.config('video:video_channel',0);
	}
}

function getData(val){
	if(debugging) console.error(val);
	if(val.demo != null){
		var helper = val.demo;
		
		// Battery
		updateBat(helper.batteryPercentage);
		
		// Velocity
		xVbox.setContent(""+helper.xVelocity);
		yVbox.setContent(""+helper.yVelocity);

		// Rotation
		str = "" + helper.leftRightDegrees;
		rollStatusBox.setContent(str);
		str = "" + helper.frontBackDegrees;
		pitchStatusBox.setContent(str);
		str = "" + (helper.clockwiseDegrees + 180);
		yawStatusBox.setContent(str);


		// Altitude
		updateAlt(helper.altitude);

		// Render the screen
		screen.render();
	}
	if(val.droneState != null){
		var helper = val.droneState;
		sosCheck(helper.emergencyLanding);
		angleCheck(helper.anglesOutOfRange);
		batteryCheck(helper.lowBattery);
		motorCheck(helper.motorProblem);
		cutoutCheck(helper.cutoutDetected);
		windCheck(helper.tooMuchWind);
		ultrasonicCheck(helper.ultrasonicSensorDeaf);
	}
}

// Logic for Ultrasonic sensor
function ultrasonicCheck(val){
	altBIP(val,panel);
	if (val != 0) warnBIP(1,panel);
}

// Logic for t/o land BIP
function flyCheck(val){
	switch(val) {
		case 'CTRL_LANDED' : flyingBIP(0,panel); break;
		case 'CTRL_HOVERING':
				flyingBIP(1,panel);
				hoverBIP(1,panel);
				break;
		case 'CTRL_FLYING' : flyingBIP(2,panel); break;
		case 'CTRL_TRANS_LANDING' : flyingBIP(4,panel); break;
		case 'CTRL_TRANS_GOTOFIX' : flyingBIP(1,panel); break;
		case 'CTRL_TRANS_LOOPING' : flyingBIP(1,panel); break;
		case 'CTRL_DEFAULT' : flyingBIP(1,panel); break;
		default: flyingBIP(-1,panel);
	}
}

// Logic for if the SOS bip should be lit
function sosCheck(val){
	sosBIP(val,panel);
	if (val != 0) errorBIP(1,panel);
}

// Logic for the wind BIP
function windCheck(val){
	windBIP(val,panel);
	if (val != 0) errorBIP(1,panel);
}

// Logic for the cutout BIP
function cutoutCheck(val){
	cutoutBIP(val,panel);
	if (val != 0) errorBIP(1,panel);
}

// Logic for motor failures
function motorCheck(val){
	motorBIP(val,panel);
	if (val != 0) errorBIP(1,panel);
}

// Logic for if there is a low battery or dead
function batteryCheck(val){
	batteryBIP(val,panel);
	if (val == 2) errorBIP(1,panel);
	if (val == 1) warnBIP(1,panel);
}

// Logic for if the angle bip should be lit
function angleCheck(val){
	angleBIP(val,panel);
	if (val != 0) errorBIP(1,panel);
}

// Create a new HUD
function initDisplay(){


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
	batteryMaster= blessed.box({
		top: 20,
		left: 50,
		width: 22,
		height: 5,
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

	// Altitude window
	altMaster = blessed.box({
		top: 20,
		left: 80,
		width: 7,
		height: 24,
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

	
	// BIP
	panel = blessed.box({
		top: 30,
		left: 10,
		width: 52,
		height: 14,
		border:{
			type: 'line'
		}
	});

	// Vertical speed indicator
	newBarPN(-100,20,90,vsBar,'vertical',20);
	
	initBIP(panel);
	addRoll(rotationMaster);
	addSpeed(velocityMaster);
	addBattery(batteryMaster);
	addAlt(altMaster);

	screen.append(panel);
	screen.append(rotationMaster);
	screen.append(velocityMaster);
	screen.append(batteryMaster);
	screen.append(altMaster);

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
	  content: '0.0000',
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
	  left: 6,
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
	  left: 8,
	  width: 4,
	  height: 1,
	  content: '00%',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
createBar(0,2,0,batteryBar, 'horizontal', 20, 50,batteryMaster,20);
batteryMaster.append(batteryBox);
batteryMaster.append(titleBattery);
}

// add in altitude status
function addAlt(altMaster){
	var titleAlt= blessed.text({
	  top: 0,
	  left: 1,
	  width: 3,
	  height: 1,
	  content: '{bold}Alt{/bold}',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
	altBox= blessed.text({
	  top:  1,
	  left: 1,
	  width: 4,
	  height: 1,
	  content: '0000',
	  tags: true,
	  style: {
		fg: 'white',
	  }
	});
createBar(99,2,0,altBar, 'vertical', 10, 20,altMaster,20);
altMaster.append(altBox);
altMaster.append(titleAlt);
}

// Update altitude 
function updateAlt(val){
	altBox.setContent(""+val);
	if(val<0.5) createBar(val*200,2,0,altBar, 'vertical', 99, 20,altMaster,20);
	else if(val<1) createBar(val*100,2,0,altBar, 'vertical', 00, 99,altMaster,20);
	else createBar(val*10,2,0,altBar, 'vertical', 0, 0,altMaster,20);
}

// Update battery
function updateBat(val){
		createBar(val,2,0,batteryBar, 'horizontal', 20, 50,batteryMaster,20);
		batteryBox.setContent(""+val+"%");
		if(val<5) batteryCheck(2); // trigger the error light for low power

}
// Display any information
function info(val){
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
		bg: 'green',
	}
	});
	screen.append(errorBox);
	screen.render();
}

// Display any errors
function error(val){
	setTimeout(clearErrors, 10000); // clear the error after 10 seconds
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

// Display any warnings
function warn(val){
	setTimeout(clearErrors, 3000); // clear the error after 3 seconds
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
function createBar(val,x,y,bar,orientation, red,yellow,master, size){
	if (val < 0) newBar('red',0,x,y,bar,orientation,master,size); // deal with <0 numbers
	if (val < red){
		newBar('red',val,x,y,bar,orientation,master,size);
	}
	else if(val < yellow){
		newBar('yellow',val,x,y,bar,orientation,master,size);
	}
	else if(val < 100) {
		newBar('green',val,x,y,bar,orientation,master,size);
	}
	else{
		newBar('green',100,x,y,bar,orientation,master,size);
	}	
}

// Create a bar of a specefic color
function newBar(col, val, x, y,bar, orientation, master, size){
	var width, height;
	if(orientation == 'horizontal'){
		width = size;
		height = 1;
	}
	else{
		orientation='vertical';
		width = 5;
		height = size;
	}
	
	bar= blessed.ProgressBar({
		top: x,
		left: y,
		orientation: orientation,
		style: {
			fg: 'black',
			bg: 'black',
			bar: {
				bg: col,
				fg: 'default'
			},
			border: {
				fg: 'default',
				bg: 'default'
			}
		},
		
		width: width,
		height: height,
		filled: val,
	});
	master.append(bar);
}

// Create a color coded bar which goes red for <0 numbers
function newBarPN(val, x, y, bar, orientation, size){

	var col = (val < 0 ? 'red' : 'green');

	var width, height, midWidth, midHeight, xBar, yBar;
	if(Math.abs(val) < 10){
		val = val * 10 / Math.abs(val);
	}
	if(orientation == 'horizontal'){
		width = size;
		midWidth = size/2;
		height = 3;
		midHeight = 3;
		xBar = x;
		yBar = y;
		if(val < 0){
			val = -val;
			yBar = y + midWidth;
			midWidth*= (val/100);
			midWidth = Math.round(midWidth);
			val = 100;
		}
	}
	else{
		orientation='vertical';
		width = 4;
		midWidth = 4;
		height = size;
		midHeight = size/2;
		xBar = x;
		yBar = y;
		if(val < 0){
			val = -val;
			xBar = x + midHeight;
			midHeight *= (val/100);
			midHeight = Math.round(midHeight);
			val = 100;
		}
	}

	var edge = blessed.box({
		top: x-1,
		left: y-1,
		width: width+2,
		height: height+2,
		tags: true,
		border: {
			type: 'line'
		},
		style: {
			border: {
					fg: '#ffffff'
			}
		}
	})

		bar= blessed.ProgressBar({
			top: xBar,
			left: yBar,
			orientation: orientation,
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
			
			width: midWidth,
			height: midHeight,
			filled: val,
		});
		screen.append(edge);
		screen.append(bar);
		screen.render();
}


// Create the BIP

function initBIP(screen){
	flyingBIP(0,screen);
	batteryBIP(0,screen);
	cameraBIP(0,screen);
	hoverBIP(0,screen);
	angleBIP(0,screen);
	motorBIP(0,screen);
	commBIP(0,screen);
	warnBIP(0,screen);
	errorBIP(0,screen);
	cutoutBIP(0,screen);
	altBIP(0,screen);
	sosBIP(0,screen);
	windBIP(0,screen);
}

function showText(col, x, y, text, master){
var textCol = (col == 'black') ? 'gray' : 'white';

var titleAlt= blessed.text({
	top: x,
	left: y,
	width: 10,
	height: 4,
	content: text,
	align: 'center',
		border: {
			bg: col
		},
	style: {
		fg: textCol,
		bg: col
	}
});
master.append(titleAlt);
//screen.append(master);
screen.render();
}

function flyingBIP(mode,screen){
	switch(mode){
		case 0: showText('black',0,0,'Landed',screen); break;
		case 1: showText('yellow',0,0,'Auto',screen); break;
		case 2: showText('green',0,0,'Flying',screen); break;
		case 3: showText('green',0,0,'Other\nState',screen); break;
		case 4: showText('green',0,0,'Landing',screen); break;
		default: showText('red',0,0,'Unknown\nOption',screen); break;
	}
}

function cameraBIP(mode,screen){
	switch(mode){
		case 0: showText('green',4,0,'Front\nCamera',screen);
				showText('black',8,0,'Down\nCamera',screen);
				break;
		case 1: showText('black',4,0,'Front\nCamera',screen);
				showText('green',8,0,'Down\nCamera',screen);
				break;
		default:showText('red',4,0,'Front\nCamera',screen);
				showText('red',8,0,'Down\nCamera',screen);
				break;
	}
}

function batteryBIP(mode,screen){
	switch(mode){
		case 0: showText('black',0,10,'Battery\nLow',screen);
				showText('black',0,20,'Battery\nDead',screen);
				break;
		case 1: showText('yellow',0,10,'Battery\nLow',screen);
				showText('black',0,20,'Battery\nDead',screen);
				break;
		case 2: showText('yellow',0,10,'Battery\nLow',screen);
				showText('red',0,20,'Battery\nDead',screen);
				break;
		default: showText('red',0,10,'Battery\nUnknown',screen);
				showText('red',0,20,'Battery\nUnknown',screen);
				break;
	}
}

function hoverBIP(mode,screen){
	switch(mode){
		case 0: showText('black',4,10,'Hover',screen); break;
		case 1: showText('green',4,10,'Hover',screen); break;
		default: showText('red',4,10,'Unknown\nHover',screen); break;
	}
}

function angleBIP(mode,screen){
	switch(mode){
		case 0: showText('black',8,10,'Angle\nRange',screen); break;
		case 1: showText('red',8,10,'Angle\nRange',screen); break;
		default: showText('red',8,10,'Unknown\nAngles',screen); break;
	}
}

function motorBIP(mode,screen){
	switch(mode){
		case 0: showText('black',4,20,'Motor',screen); break;
		case 1: showText('red',4,20,'Motor',screen); break;
		default: showText('red',4,20,'Unknown\nMotor',screen); break;
	}
}

function commBIP(mode,screen){
	switch(mode){
		case 0: showText('black',8,20,'Comm\nFail',screen); break;
		case 1: showText('yellow',8,20,'Comm\nFail',screen); break;
		case 2: showText('red',8,20,'Comm\nFail',screen); break;
		default: showText('red',8,20,'Unknown\nComm',screen); break;
	}
}

function warnBIP(mode,screen){
	switch(mode){
		case 0: showText('black',0,30,'Master\nWarning',screen); break;
		case 1: showText('yellow',0,30,'Master\nWarning',screen); break;
		default: showText('red',0,30,'Unknown\nWarn',screen); break;
	}
}

function errorBIP(mode,screen){
	switch(mode){
		case 0: showText('black',0,40,'Master\nError',screen); break;
		case 1: showText('red',0,40,'Master\nError',screen); break;
		default: showText('red',0,40,'Unknown\nError',screen); break;
	}
}

function cutoutBIP(mode,screen){
	switch(mode){
		case 0: showText('black',4,30,'Cutout',screen); break;
		case 1: showText('red',4,30,'Cutout',screen); break;
		default: showText('red',4,30,'Unknown\nCutout',screen); break;
	}
}

function altBIP(mode,screen){
	switch(mode){
		case 0: showText('black',8,30,'Alt\nIssue',screen); break;
		case 1: showText('yellow',8,30,'Alt\nIssue',screen); break;
		case 2: showText('red',8,30,'Alt\nIssue',screen); break;
		default: showText('red',8,30,'Unknown\nAlt',screen); break;
	}
}

function sosBIP(mode,screen){
	switch(mode){
		case 0: showText('black',4,40,'SOS\nMode',screen); break;
		case 1: showText('red',4,40,'SOS\nMode',screen); break;
		default: showText('red',4,40,'Unknown\nSOS',screen); break;
	}
}

function windBIP(mode,screen){
	switch(mode){
		case 0: showText('black',8,40,'Wind',screen); break;
		case 1: showText('red',8,40,'Wind',screen); break;
		default: showText('red',8,40,'Unknown\nWind',screen); break;
	}
}
