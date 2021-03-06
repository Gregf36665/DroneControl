var blessed = require("blessed");

var screen;

screen = blessed.screen({
	autopad: true,
	smartCSR: true,
});
// exit the program by using esc q or ctl-c
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

var panel = blessed.box({
	top: 0,
	left: 0,
	width: 52,
	height: 14,
	border:{
		type: 'line'
	}
});

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
screen.append(master);
screen.render();
}

function flyingBIP(mode,screen){
	switch(mode){
		case 0: showText('black',0,0,'Landed',screen); break;
		case 1: showText('yellow',0,0,'Auto',screen); break;
		case 2: showText('green',0,0,'Flying',screen); break;
		case 3: showText('green',0,0,'Other\nState',screen); break;
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

var flyCount = 0;
function fly(){
	flyingBIP(flyCount, panel);
	if(flyCount==4) flyCount = 0;
	else flyCount++;
}

var camCount = 0;
function cam(){
	cameraBIP(camCount, panel);
	if(camCount==2) camCount = 0;
	else camCount++;
}

var batteryCount=0;
function batt(){
	batteryBIP(batteryCount, panel);
	if(batteryCount==3) batteryCount = 0;
	else batteryCount++;
}

var hoverCount=0;
function hover(){
	hoverBIP(hoverCount, panel);
	if(hoverCount==3) hoverCount = 0;
	else hoverCount++;
}

var motorCount=0;
function motor(){
	motorBIP(motorCount, panel);
	if(motorCount==3) motorCount = 0;
	else motorCount++;
}
	
var angleCount=0;
function angle(){
	angleBIP(angleCount, panel);
	if(angleCount==3) angleCount = 0;
	else angleCount++;
}

var commCount=0;
function comm(){
	commBIP(commCount, panel);
	if(commCount==3) commCount = 0;
	else commCount++;
}

var cutoutCount=0;
function cutout(){
	cutoutBIP(cutoutCount, panel);
	if(cutoutCount==3) cutoutCount = 0;
	else cutoutCount++;
}

var altCount=0;
function alt(){
	altBIP(altCount, panel);
	if(altCount==3) altCount = 0;
	else altCount++;
}

var windCount=0;
function wind(){
	windBIP(windCount, panel);
	if(windCount==2) windCount = 0;
	else windCount++;
}

var sosCount=0;
function sos(){
	sosBIP(sosCount, panel);
	if(sosCount==2) sosCount = 0;
	else sosCount++;
}

var warnCount=0;
function warn(){
	warnBIP(warnCount, panel);
	if(warnCount==2) warnCount = 0;
	else warnCount++;
}

var errorCount=0;
function error(){
	errorBIP(errorCount, panel);
	if(errorCount==2) errorCount = 0;
	else errorCount++;
}

setTimeout(clearInterval, 9000, setInterval(fly,1000));
setTimeout(clearInterval, 12000, setInterval(cam,1000));
setTimeout(clearInterval, 12000, setInterval(batt,1000));
setTimeout(clearInterval, 12000, setInterval(hover,1000));
setTimeout(clearInterval, 12000, setInterval(motor,1000));
setTimeout(clearInterval, 12000, setInterval(angle,1000));
setTimeout(clearInterval, 12000, setInterval(comm,1000));
setTimeout(clearInterval, 12000, setInterval(cutout,1000));
setTimeout(clearInterval, 12000, setInterval(alt,1000));
setTimeout(clearInterval, 12000, setInterval(sos,1000));
setTimeout(clearInterval, 12000, setInterval(wind,1000));
setTimeout(clearInterval, 12000, setInterval(warn,1000));
setTimeout(clearInterval, 12000, setInterval(error,1000));
