var blessed = require("blessed");
var fillAmount1 = 50;
var bar1;

var screen = blessed.screen({
	autopad: true,
	smartCSR: true,
});
// exit the program by using esc q or ctl-c
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});



createBar(50,10,20,bar1,'vertical',20);
screen.render();

screen.key(['k'], function(ch, key) {
	if(fillAmount1<99) fillAmount1 += 1;
	createBar(fillAmount1,10,20,bar1,'vertical',20);
	screen.render();
});
screen.key(['j'], function(ch, key) {
	if(fillAmount1>-100) fillAmount1 -= 1;
	createBar(fillAmount1,10,20,bar1,'vertical',20);
	screen.render();
});



function createBar(val,x,y,bar,orientation, size){
	newBarPN(val,x,y,bar,orientation,size);
}


function newBarPN(val, x, y, bar, orientation, size){

	var col = (val < 0 ? 'red' : 'green');

	var width, height, midWidth, midHeight, xBar, yBar;
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
}
