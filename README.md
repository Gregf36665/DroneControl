# DroneControl
A TUI using nodeJS to control the Parrot AR Drone 2.0 with a joystick

Controls
========

The quadcopter moves by either rotating around an axis or changing the thrust symetrically
This requires only a 2-axis joystick and a throttle
To be able to yaw and point the camera in a good direction a third axis is required

For rotation the program detects if the joystick moves and sends the command to the drone
For thrust it detects movement and saves the current value
From there it consistantly tells the drone to go up or down depending on the thrust
This makes the throttle feel more realistic and fixes a bug
You used to have to manually pulse the throttle so the program would keep triggering

Development
===========

Currently refining the TUI so there is more information on the screen

Next major change: 
-------------------
Crosshairs for velocity and rotational information

Known Bugs
==========

The camera suffers a 7 second delay for no apparent reason
