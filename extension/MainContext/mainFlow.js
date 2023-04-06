async function mainFlow() {
  const shadowRoot = document.querySelector("landing-page").shadowRoot;
  const connectBtn = shadowRoot.querySelector("#connectBtn");

  connectBtn.addEventListener("click", bluetoothSetup);
}

async function bluetoothSetup() {
  let thinToken = await requestThinTokenReaderService();

  btListen(thinToken, BT.STATUS_CHARACTERISTIC, statusChangeHandler);
  beginWriteMode(thinToken);

  const appContainer = document.querySelector("#app-container");
  appContainer.addEventListener("ThinToken_FormDone", (ev) => {
    addData(thinToken, ev.detail.label, ev.detail.secret);
  });
}

function statusChangeHandler(val) {
  if (val.byteLength != 0) {
    val = new Uint8Array(val.buffer);
    val = val[0];
    
    let statusName = Object.keys(STATUS).find(k => STATUS[k] === val);
    console.log(`${val}: ${statusName}`);

    switch (val) {
      case STATUS.WriteTagReady:
        if (history.state.page == "landing-page") {
          navHandler("account-list");
        }
        break;
    
      default:
        break;
    }
  }
}

async function beginWriteMode(thinToken) {
  const status = await thinToken.getCharacteristic(BT.STATUS_CHARACTERISTIC);
  let req = new Uint8Array(new ArrayBuffer(1));
  req[0] = STATUS.WriteFlowRequested;
  status.writeValueWithResponse(req);
}

async function endWriteMode(thinToken) {
  const status = await thinToken.getCharacteristic(BT.STATUS_CHARACTERISTIC);
  let req = new Uint8Array(new ArrayBuffer(1));
  req[0] = STATUS.WriteFlowEndRequest;
  status.writeValueWithResponse(req);
}

async function addData(thinToken, label, secret) {
  console.log("Add data: ");
  console.log(label);
  console.log(secret);

  // Sanitize label and secret from ',' character
  label = label.replace(',', "%2C");
  secret = secret.replace(',', "%2C");

  let btMsg = label + "," + secret;
  btMsg = new TextEncoder().encode(btMsg);

  const secretChar = await thinToken.getCharacteristic(BT.SECRET_CHARACTERISTIC);
  secretChar.writeValueWithoutResponse(btMsg);

}