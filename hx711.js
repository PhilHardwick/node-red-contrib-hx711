module.exports = function(RED) {

  var m = require('mraa');
  var fs = require('fs');
  var hx711 = require('jsupm_hx711');

  function hx711(n) {
    //init
    RED.nodes.createNode(this,n);
    this.log("Node created");

    //properties
    this.name = n.name;
    this.scale = parseFloat(n.scale);
    this.dataPin = parseInt(n.dataPin);
    this.clockPin = parseInt(n.clockPin);
    this.interval = n.interval;
    this.log("Conifg parsed");
    if(parseInt(this.platform) == 512) {
      var file;
      try {
        file = fs.readFileSync('/tmp/imraa.lock', 'utf8');
        var arr = JSON.parse(file).Platform;
        for (var i = 0; i < arr.length; i++) {
          if(arr[i].hasOwnProperty('uart')) {
            //explicitly add the FIRMATA subplatform for MRAA
            m.addSubplatform(m.GENERIC_FIRMATA, arr[i].uart);
          }
        }
      } catch (e) {
        if (e.code === 'ENOENT') {
          //if we cannot find lock file we assume ttyACM0 and try
          m.addSubplatform(m.GENERIC_FIRMATA, "/dev/ttyACM0");
        }
      }
    }
    this.log("Got device");
    this.sensor = new hx711.HX711(this.dataPin, this.clockPin);
    this.log("Created scale");
    this.sensor.setScale(this.scale);
    this.sensor.tare();
    this.log("Configured and zeroed scale");
    this.status({});

    var node = this;

    var msg = { topic: node.name + '/A' + node.dataPin + '/A' + node.clockPin };

    //poll reading at interval
    this.log("Set to send message every " + this.interval);
    this.timer = setInterval(function() {
      msg.payload = node.sensor.readUnits(10);
      node.send(msg);
    }, node.interval);

    //clear interval on exit
    this.on('close', function() {
      clearInterval(node.timer);
    });
  }
  this.log("Registering node");
  RED.nodes.registerType('upm-hx711', hx711);
};