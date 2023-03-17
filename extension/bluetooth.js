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

async function listenToStatus(tokenService) {
  const statusCharacteristicUuid = "49a2d591-16b6-4401-a328-cb9e93b3c767";
  let _characteristic = await tokenService.getCharacteristic(statusCharacteristicUuid);
  console.log(_characteristic);
  _characteristic.startNotifications();
  _characteristic.addEventListener("characteristicvaluechanged", (ev) => {
    console.log(ev.target.value);
  });
  console.log(`Listening for status notifications from ${tokenService.device.name}`);

  return _characteristic;
}

let connectBtn = document.querySelector("#connectBtn");
connectBtn.addEventListener("click", async (ev) => {
  const service = await requestThinTokenReaderService();
  const statusListener = await listenToStatus(service);
});