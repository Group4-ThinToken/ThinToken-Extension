async function requestThinTokenReaderService() {
  let _tokenService;
  const primaryUuid = "5fcf031e-75a8-46a3-96da-3e9a818019b8";
  try {
    let _deviceReq = await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: [ primaryUuid ]
        }
      ]
    });

    _deviceReq.addEventListener('gattserverdisconnected', (ev) => {
      console.log("Bluetooth disconnected");
    });

    let _device = await _deviceReq.gatt.connect();

    _tokenService = await _device.getPrimaryService(primaryUuid);

  } catch (error) {

    console.error(error);

  }

  window.addEventListener("beforeunload", () => {
    if (_device.gatt.connected) {
      _device.gatt.disconnect();
    }
  });

  console.log(_tokenService);
  return _tokenService;
}

async function btListen(tokenService, characteristic, handler) {
  let _characteristic = await tokenService.getCharacteristic(characteristic);
  _characteristic.startNotifications();
  _characteristic.addEventListener("characteristicvaluechanged", (ev) => {
    handler(ev.target.value);
  });
  console.log(`Listening for ${tokenService.device.name} > ${characteristic}`);
}

async function updateReaderTime(tokenService) {
  let _timeCharacteristic = await tokenService.getCharacteristic(BT.TIME_CHARACTERISTIC);
  let now = Math.floor(Date.now() / 1000);
  let buffer = new ArrayBuffer(4);
  let view = new Uint32Array(buffer);
  view[0] = now;

  _timeCharacteristic.writeValueWithResponse(buffer);
}

async function updateStatus(statusCharacteristic, newVal) {
  return await statusCharacteristic.writeValueWithResponse(Uint8Array.of(newVal));
}