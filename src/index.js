// Serialport's debug capabilities enable/disable
// process.env.DEBUG ="*"

const {SerialPortStream} = require('@serialport/stream');
const {ReadlineParser} = require('@serialport/parser-readline');

// @brightsign/serialport is supported in OS 8.2.26+, this is replacing the /src/bs-binding.js
const BrightSignBinding = require('@brightsign/serialport');
const SerialPortListClass = require("@brightsign/serialportlist");

let serialUsbPorts = {};

async function main() {
    const serialPortList = new SerialPortListClass();
    const serialPorts = await serialPortList.getList();

    for (p = 0; p < serialPorts.length; p++) {
        if ("USB" === serialPorts[p]["fid"].substring(0, 3)) {
            console.log(`Found USB serial port at ${serialPorts[p]['fid']}`);

            let path = serialPorts[p]["path"];
            serialUsbPorts[path] = createSerialPort(path, path);
            writeOut(serialUsbPorts[path], 0);
        }
    }
    console.log(serialUsbPorts);
}

function createSerialPort(path /*, name*/) {

    const portOptions = {
        binding: BrightSignBinding,
        path: path,
        baudRate: 9600, // Update to reflect the expected baud rate
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        autoOpen: false,
    };

    port = new SerialPortStream(portOptions);
    let parser = port.pipe(new ReadlineParser());

    port.open(function (err) {
        if (err) {
            return console.log(`Error opening port: ${err.message}`);
        }
        console.log(`connected to serial ${path}, isOpen: ${port.isOpen}`);
    });

    // Receiver
    parser.on('data', function (data) {
        console.log(`Received on ${path} parsed data: ${data}`);
    });

    // Open errors will be emitted as an error event
    port.on('error', function (err) {
        console.log(err);
        console.log(`Error: ${err.message}`);
    })

    return port;
}

// Transmitter
function writeOut(serialPort, count) {
    let msg = `sent from ${serialPort.path} count: ${count}\n`;
    serialPort.write((msg), function (err) {
        if (err) {
            console.log(err);
            return console.log(`Error on write: ${err.message}`);
        }

        console.log(`${serialPort.path} message written: ${msg}`);

        count += 1;
        setTimeout(writeOut, 1000, serialPort, count);
    });
}

window.main = main;