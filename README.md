# node-red-contrib-rflink
A Node-red node to encode/decode the messages from/to the [RFLink gateway](http://www.nemcon.nl/blog2).

## Install

```
cd ~\.node-red
npm install node-red-contrib-rflink
```

## Notes
It's required to specify name and id of devices that you want to read/write via RFLink gateway.
For example, if the packet from RFLink gateway is `20;32;Auriol;ID=008f;TEMP=00d3;BAT=OK;`, its name is Auriol and id is 008f.
It's also required to know what kind of values are provided. In the above example, the device has 2 values, TEMP and BAT. The `msg.payload` will have `msg.payload.temp` and `msg.payload.bat`.

## Credits
Node icon is downloaded from www.flaticon.com - http://www.flaticon.com/free-icon/modem_99558.  
