const { SerialPort } = require('serialport');
const path = require('path');
const fs = require('fs');

const PORTS_FILE = path.join(__dirname, 'ports.json');
const SCAN_INTERVAL = 5000; // Scan every 5 seconds

// Arduino board database
const ARDUINO_BOARDS = {
  '2341': { // Official Arduino
    '0043': 'Arduino Due',
    '004E': 'Arduino Mega 2560',
    '0041': 'Arduino Uno',
    '0044': 'Arduino Nano'
  },
  '1A86': { // CH340 chips
    '7523': 'CH340 (Uno/Nano Clone)',
    '5523': 'CH341 (Mega Clone)'
  }
};

async function detectArduinos() {
  try {
    const ports = await SerialPort.list();
    return ports.map(port => {
      const vid = port.vendorId?.toUpperCase();
      const pid = port.productId?.toUpperCase();
      const description = ARDUINO_BOARDS[vid]?.[pid] || 'Unknown Serial Device';
      
      return {
        address: port.path,
        description,
        manufacturer: port.manufacturer || 'Unknown',
        vid,
        pid,
        serialNumber: port.serialNumber || 'None'
      };
    });
  } catch (error) {
    console.error('Detection error:', error);
    return [];
  }
}

async function updatePortsFile() {
  try {
    const ports = await detectArduinos();
    const data = {
      ports: ports,
      timestamp: new Date().toISOString()
    };
    await fs.promises.writeFile(PORTS_FILE, JSON.stringify(data, null, 2));
    console.log(`Updated ports.json with ${ports.length} ports`);
  } catch (error) {
    console.error('Error updating ports file:', error);
  }
}

// Initial scan and then periodic updates
updatePortsFile();
setInterval(updatePortsFile, SCAN_INTERVAL);

console.log('Arduino port detection service running...');