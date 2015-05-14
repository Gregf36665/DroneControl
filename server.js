var express = require('express');
var app = express();

app.get('/', function(req, res){
		res.send('hello world');
		process.stdout.write("\r                      "); // flush the last text from the display
		process.stdout.write("\rSomeone connected");
		});

app.listen(3000);
process.stdout.write("Listening on port 3000");
var sys = require('sys')
var exec = require('child_process').exec;
var child;

// executes `pwd`
child = exec("ls", function (error, stdout, stderr) {
  process.stdout.write('stdout: ' + stdout);
  process.stdout.write('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
});
