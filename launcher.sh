#start video and send output to null, also start it in bg
ffplay tcp://192.168.1.1:5555  >& /dev/null &

# resize terminal window
resize -s 50 180 >&/dev/null
#start up control
node control.js -d 2> log.txt

#close ffplay when done
pkill -x ffplay
