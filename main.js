let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');
var serviceUuid = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
var characteristicUuid = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
var characteristicRX = 'e3327c31-3123-4a99-bf27-b900c24c4e68';
let lastValue;
var button1on = document.getElementById('sw1_on');
var button1off = document.getElementById('sw1_off');
var deviceName;
var toSend;
connectButton.addEventListener('click', function() {
  connect();
});

disconnectButton.addEventListener('click', function() {
  disconnect();
});

button1on.addEventListener('click',function(){
  sendStatus(303429489,2,1);console.log("Relay ON 2");
  setTimeout(() => {   sendStatus(303429489,2,0);console.log("Relay OFF 2"); }, 1000);

});

button1off.addEventListener('click',function(){
  sendStatus(303429489,3,1);console.log("Relay ON 3");
  setTimeout(() => {   sendStatus(303429489,3,0);console.log("Relay OFF 3"); }, 1000);
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



function sendStatus(DID,switch_id,switch_state){
  log("device name "+deviceName);
  // var deviceId = String(deviceName).substring(String(deviceName).indexOf("-")+1);
  // var deviceId = "303429489"; 2883020137 3289302245
  var deviceId = DID;

  console.log('Device ID : '+ deviceId);
  log('Device ID : '+ deviceId);
  toSend = "xxxxx/"+deviceId+"/"+switch_id+"/"+switch_state;
  // var toSend = "wifi/clear";
  log('To send : '+ toSend);
  toSend.trim();

  // return deviceCache.gatt.getPrimaryService(serviceUuid)
  // .then(service => service.getCharacteristic(characteristicUuid))
  // .then(characteristic => characteristic.writeValue(toSend));
  log(toSend.type);

  // write(toSend,false);
  send(toSend);

}

let deviceCache = null;

let characteristicCache = null;

let readBuffer = '';

function connect() {
  return (deviceCache ? Promise.resolve(deviceCache) :
      requestBluetoothDevice()).
      then(device => connectDeviceAndCacheCharacteristic(device)).
      then(characteristicRX => startNotifications(characteristicRX)).
      // then(characteristic => {
      //   // Writing 1 is the signal to reset energy expended.
      //   return characteristic.writeValue(toSend);
      // }).
      catch(error => log(error));
}

function requestBluetoothDevice() {
  log('Requesting bluetooth device...');
  return navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    // filters: [{namePrefix: 'HS-'}],
    optionalServices: [serviceUuid],
  }).
      then(device => {
        log('"' + device.name + '" bluetooth device selected');
        deviceCache = device;
        deviceCache.addEventListener('gattserverdisconnected',
            handleDisconnection);
        deviceName = String(device.name);
        return deviceCache;
      });
}


function handleDisconnection(event) {
  let device = event.target;

  log('"' + device.name +
      '" bluetooth device disconnected, trying to reconnect...');

  connectDeviceAndCacheCharacteristic(device).
      then(characteristicRX => startNotifications(characteristicRX)).
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
  console.log('Starting notifications...');
  console.log('Connected');
  log1('Connected');
  // return characteristic.startNotifications().
  //     then(() => {
  //       log('Notifications started');
  //       characteristic.addEventListener('characteristicvaluechanged',
  //           handleCharacteristicValueChanged);
  //     });

      return deviceCache.gatt.getPrimaryService(serviceUuid)
      .then(service => service.getCharacteristic(characteristicRX))
      .then(characteristicRX => characteristicRX.startNotifications())
      .then(characteristicRX => characteristicRX.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged));
}
//Autoscroll
function pageScroll() {
  window.scrollBy(0,500);
  scrolldelay = setTimeout(pageScroll,5000);
}
function changeBodyBg(color){
  document.getElementById('sw1_on').style.backgroundColor = color;
  document.getElementById('sw1_off').style.backgroundColor = color;

}

function changeBodyBgInactive(color){
  document.getElementById('sw1_on').style.backgroundColor = color;
  document.getElementById('sw1_off').style.backgroundColor = color;
}

function handleCharacteristicValueChanged(event) {
  let value = new TextDecoder().decode(event.target.value);
  console.log(value);
  pageScroll();
  if(!value.match('inactive')){
    console.log("ACK from Device");
    changeBodyBg('#7FB00');
  }
  else{
    console.log("Not ACK from Device");
    changeBodyBgInactive('#F6511D');
  }  
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

function log1(data, type = '') {
  terminalContainer.insertAdjacentHTML('beforeend',
      '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
}
function log(data, type = '') {
  // terminalContainer.insertAdjacentHTML('beforeend',
  //     '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
}
function logs(data, type = '') {
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

  if (data.length > 10) {
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
  let encoder = new TextEncoder('utf-8');
  characteristic.writeValue(encoder.encode(data));
}
 function write (data, string = true) {
	p = new Promise(function (resolve, reject) {
		// See if the device is paired.
		if (pairedDevices) {
			// Has a write reference been discovered.
			if (characteristicUuid != null) {
				// Don't double encode.
				if (string) {
					let encoder = new TextEncoder('utf-8');
					characteristicUuid.writeValue(encoder.encode(data));
				} else {
					dataInUint8 = Uint8Array.from(data);
					characteristicUuid.writeValue(dataInUint8);
				}
				resolve();

			} else {
				reject("No write characteristic")
			}
		} else {
			reject("No devices paired.")
		}
	}).catch(error => {
	});
	return p;
}