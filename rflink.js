module.exports = function(RED) {
    "use strict"
    // rflink device configuration node
    function RFLinkDeviceNode(config) {
        RED.nodes.createNode(this, config);
        this.devname = config.devname;
        this.devid = config.devid;
    }
    RED.nodes.registerType("rflink device", RFLinkDeviceNode);

    // rflink in node
    function RFLinkInNode(config) {
        RED.nodes.createNode(this, config);
        this.device = RED.nodes.getNode(config.device);
        this.name = config.name;
        var node = this;
        this.on('input', function(msg) {
            var valid = true;

            if (!node.device) {
                valid = false;
                node.error('Please set rflink device to be used.');
                node.status({ fill: "red", shape: "ring", text: "device not provided" });
            }

            if (valid) {
                // Check if the message is for the given device
                // 20;01;AcuriteV2;ID=e9a4;TEMP=00d8;HUM=47;BAT=OK;
                var idx = msg.payload.indexOf(node.device.devname + ";ID=" + node.device.devid + ";");
                var command = msg.payload.substring(0, 3)
                if (idx >= 0 && command == "20;") {
                    // Notifies data has been received
                    node.status({ fill: "green", shape: "ring", text: "data received" });
                    msg.payload = parseRFLinkPackets(msg.payload);
                    msg.devname = node.device.devname;
                    msg.devid = node.device.devid;
                    node.send(msg);
                }
            }
        });
    }
    RED.nodes.registerType("rflink in", RFLinkInNode);

    // rflink out node
    function RFLinkOutNode(config) {
        RED.nodes.createNode(this, config);
        this.device = RED.nodes.getNode(config.device);
        this.target = config.target;
        this.command = config.command;
        this.milightcontrol = config.milightcontrol;
        this.name = config.name;
        var node = this;
        this.on('input', function(msg) {
            var valid = true;

            if (!node.device) {
                valid = false;
                node.error('Please set rflink device to be used.');
                node.status({ fill: "red", shape: "ring", text: "device not provided" });
            }

            if (valid) {
                if (typeof msg.target == 'undefined' && !node.target) {
                    valid = false;
                    node.error('Please set target to be used.');
                    node.status({ fill: "red", shape: "ring", text: "target not provided" });
                }
            }

            if (valid) {
                if (typeof msg.command == 'undefined' && !node.command) {
                    valid = false;
                    node.error('Please set command to be used.');
                    node.status({ fill: "red", shape: "ring", text: "command not provided" });
                }
            }

            msg.devname = node.device.devname;
            msg.devid = node.device.devid;
            msg.target = node.target || msg.target;
            msg.command = node.command || msg.command;

            if (valid && msg.devname == "MiLightv1") {
                if (typeof msg.milightcontrol == 'undefined' && !node.milightcontrol) {
                    valid = false;
                    node.error('Please set MiLight control to be used.');
                    node.status({ fill: "red", shape: "ring", text: "MiLight control not provided" });
                }
            }
            msg.milightcontrol = node.milightcontrol || msg.milightcontrol;

            var packet;
            if (valid) {
                // 10;Kaku;00004d;1;OFF;
                if (msg.devname != "MiLightv1") {
                    packet = "10;" + msg.devname + ";" + msg.devid + ";" + msg.target + ";" + msg.command + ";";
                // 10;MiLightv1;F746;01;34BC;UNPAIR;
                } else {
                    packet = "10;" + msg.devname + ";" + msg.devid + ";" + msg.target + ";" + msg.milightcontrol + ";" + msg.command + ";";
                }
            }

            if (packet) {
                node.status({ fill: "green", shape: "ring", text: "packet written" });
                msg.payload = packet;
                node.send(msg);
            }
        });
    }
    RED.nodes.registerType("rflink out", RFLinkOutNode);

    // parse function for RFLink packets
    // see original function code: http://tech.scargill.net/rflink-and-node-red/
    function parseRFLinkPackets(packet) {
        var result = {};
        var parts = packet.split(";");

        result.name = parts[2];

        var idx = 3;
        var value;
        while (idx < parts.length) {
            value = parts[idx].split("=");
            switch (value[0]) {
                case "ID": result.id = value[1]; break;
                case "SWITCH": result.switch = value[1]; break;
                case "CMD": result.cmd = value[1]; break;
                case "SET_LEVEL": result.set_level = parseInt(value[1], 10); break;
                case "TEMP": result.temp = parseInt(value[1], 16);
                  if ((result.temp & 0x8000) > 0) {  // temperature is an signed int16
                       result.temp = result.temp & 0x7FFF;
                       result.temp = 0-result.temp;
                  }
                  result.temp = result.temp / 10;
                  break;
                case "HUM": result.hum = parseInt(value[1], 10); break;
                case "BARO": result.baro = parseInt(value[1], 16); break;
                case "HSTATUS": result.hstatus = parseInt(value[1], 10); break;
                case "BFORECAST": result.bforecast = parseInt(value[1], 10); break;
                case "UV": result.uv = parseInt(value[1], 16); break;
                case "LUX": result.lux = parseInt(value[1], 16); break;
                case "BAT": result.bat = value[1]; break;
                case "RAIN": result.rain = parseInt(value[1], 16) / 10; break;
                case "RAIN": result.rainrate = parseInt(value[1], 16) / 10; break;
                case "WINSP": result.winsp = parseInt(value[1], 16) / 10; break;
                case "AWINSP": result.awinsp = parseInt(value[1], 16) / 10; break;
                case "WINGS": result.wings = parseInt(value[1], 16); break;
                case "WINDIR": result.windir = parseInt(value[1], 10) * 22.5; break; // Wind direction 0-15 reflecting 0-360 degrees in 22.5 degree steps (decimal)
                case "WINCHL": result.winchl = parseInt(value[1], 16); break;
                case "WINTMP": result.wintmp = parseInt(value[1], 16); break;
                case "CHIME": result.chime = parseInt(value[1], 10); break;
                case "SMOKEALERT": result.smokealert = value[1]; break;
                case "PIR": result.pir = value[1]; break;
                case "CO2": result.co2 = parseInt(value[1], 10); break;
                case "SOUND": result.sound = parseInt(value[1], 10); break;
                case "KWATT": result.kwatt = parseInt(value[1], 16); break;
                case "WATT": result.watt = parseInt(value[1], 16); break;
                case "CURRENT": result.current = parseInt(value[1], 10); break;
                case "CURRENT2": result.current2 = parseInt(value[1], 10); break;
                case "CURRENT3": result.current3 = parseInt(value[1], 10); break;
                case "DIST": result.dist = parseInt(value[1], 10); break;
                case "METER": result.meter = parseInt(value[1], 10); break;
                case "VOLT": result.volt = parseInt(value[1], 10); break;
                case "RGBW": result.rgbw = parseInt(value[1].substring(2, 4), 16); break;
            }
            idx++;
        }

        return result;
    }
}
