let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');
let serviceUuid;
let characteristicUuid;
let lastValue;

connectButton.addEventListener('click', function() {
  connect();
});

disconnectButton.addEventListener('click', function() {
  disconnect();
});

sendForm.addEventListener('submit', function(event) {
  serviceUuid = document.querySelector('#service').value;
  log(serviceUuid);
  characteristicUuid = document.querySelector('#characteristic').value;
  log('characteristicUuid',characteristicUuid);


  event.preventDefault(); 
  send(inputField.value); 
  inputField.value = '';  
  inputField.focus();     
});

let deviceCache = null;

let characteristicCache = null;

let readBuffer = '';

function connect() {
  return (deviceCache ? Promise.resolve(deviceCache) :
      requestBluetoothDevice()).
      then(device => connectDeviceAndCacheCharacteristic(device)).
      then(characteristic => startNotifications(characteristic)).
      catch(error => log(error));
}

function requestBluetoothDevice() {
  log('Requesting bluetooth device...');

  



  return navigator.bluetooth.requestDevice({
    // acceptAllDevices: true,
    filters: [{services: [serviceUuid]}],
    // optionalServices: ['beb5483e-36e1-4688-b7f5-ea07361b26a8'],
  }).
      then(device => {
        log('"' + device.name + '" bluetooth device selected');
        deviceCache = device;
        deviceCache.addEventListener('gattserverdisconnected',
            handleDisconnection);

        return deviceCache;
      });
}


function handleDisconnection(event) {
  let device = event.target;

  log('"' + device.name +
      '" bluetooth device disconnected, trying to reconnect...');

  connectDeviceAndCacheCharacteristic(device).
      then(characteristic => startNotifications(characteristic)).
      catch(error => log(error));
}

function connectDeviceAndCacheCharacteristic(device) {
  if (device.gatt.connected && characteristicCache) {
    return Promise.resolve(characteristicCache);
  }

  log('Connecting to GATT server...');




  return device.gatt.connect().
      then(server => {
        log('GATT server connected, getting service...');

        return server.getPrimaryService(serviceUuid);
      }).
      then(service => {
        log('Service found, getting characteristic...');

        return service.getCharacteristic(characteristicUuid);
      }).
      then(characteristic => {
        log('Characteristic found');
        characteristicCache = characteristic;

        return characteristicCache;
      });
}

function startNotifications(characteristic) {
  log('Starting notifications...');

  return characteristic.startNotifications().
      then(() => {
        log('Notifications started');
        characteristic.addEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
      });
}
//Autoscroll
function pageScroll() {
  window.scrollBy(0,500);
  scrolldelay = setTimeout(pageScroll,5000);
}


function handleCharacteristicValueChanged(event) {
  let value = new TextDecoder().decode(event.target.value);
  // log(value);
  pageScroll();  
  if (value.match(lastValue) == false){
    // log('New Data:');
    receive(value);
    data = value;
    // for (let c of value) {
    //   if (c === '\n') {
    //     let data = readBuffer.trim();
    //     readBuffer = '';
  
    //     if (data) {
    //       receive(data);
          
    //     }
    //   }
    //   else {
    //     readBuffer += c;
    //   }
    // }
    lastValue = value;
  }


}

function receive(data) {
  log(data, 'in');
}

function log(data, type = '') {
  terminalContainer.insertAdjacentHTML('beforeend',
      '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
}

function disconnect() {
  if (deviceCache) {
    log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
    deviceCache.removeEventListener('gattserverdisconnected',
        handleDisconnection);

    if (deviceCache.gatt.connected) {
      deviceCache.gatt.disconnect();
      log('"' + deviceCache.name + '" bluetooth device disconnected');
    }
    else {
      log('"' + deviceCache.name +
          '" bluetooth device is already disconnected');
    }
  }

  if (characteristicCache) {
    characteristicCache.removeEventListener('characteristicvaluechanged',
        handleCharacteristicValueChanged);
    characteristicCache = null;
  }

  deviceCache = null;
}

function send(data) {
  data = String(data);

  if (!data || !characteristicCache) {
    return;
  }

  data += '\n';

  if (data.length > 20) {
    let chunks = data.match(/(.|[\r\n]){1,20}/g);

    writeToCharacteristic(characteristicCache, chunks[0]);

    for (let i = 1; i < chunks.length; i++) {
      setTimeout(() => {
        writeToCharacteristic(characteristicCache, chunks[i]);
      }, i * 100);
    }
  }
  else {
    writeToCharacteristic(characteristicCache, data);
  }

  log(data, 'out');
}

function writeToCharacteristic(characteristic, data) {
  characteristic.writeValue(new TextEncoder().encode(data));
}
