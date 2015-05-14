var blessed = require("blessed");
var fillAmount1 = 50;
var fillAmount2 = 50;
var bar1,bar2;

var screen = blessed.screen({
	autopad: true,
	smartCSR: true,
});
// exit the program by using esc q or ctl-c
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});



createBar(50,10,10,bar1,'vertical',30,50,20);
createBar(50,10,20,bar2,'horizontal',20,70,30);
screen.render();

screen.key(['k'], function(ch, key) {
	if(fillAmount2<99) fillAmount2 += 1;
	createBar(fillAmount2,10,20,bar2,'horizontal',20,70,30);
	screen.render();
});
screen.key(['j'], function(ch, key) {
	if(fillAmount2>1) fillAmount2 -= 1;
	createBar(fillAmount2,10,20,bar2,'horizontal',20,70,30);
	screen.render();
});

screen.key(['i'], function(ch, key) {
	if(fillAmount1<99) fillAmount1 += 1;
	createBar(fillAmount1,10,10,bar1,'vertical',30,50,20);
	screen.render();
});
screen.key(['d'], function(ch, key) {
	if(fillAmount1>1) fillAmount1 -= 1;
	createBar(fillAmount1,10,10,bar1,'vertical',30,50,20);
	screen.render();
});


function createBar(val,x,y,bar,orientation, red,yellow,size){
	if (val < 0) newBar('red',0,x,y,bar,orientation,size); // deal with <0 numbers
	if (val < red){
		newBar('red',val,x,y,bar,orientation,size);
	}
	else if(val < yellow){
		newBar('yellow',val,x,y,bar,orientation,size);
	}
	else if(val < 100) {
		newBar('green',val,x,y,bar,orientation,size);
	}
	else{
		newBar('green',100,x,y,bar,orientation,size);
	}	
}

function newBar(col, val, x, y,bar, orientation, size){
	var width, height;
	if(orientation == 'horizontal'){
		width = size;
		height = 3;
	}
	else{
		orientation='vertical';
		width = 4;
		height = size;
	}
	
	bar= blessed.ProgressBar({
		top: x,
		left: y,
		border: 'line',
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
		
		width: width,
		height: height,
		filled: val,
	});
	screen.append(bar);
}
