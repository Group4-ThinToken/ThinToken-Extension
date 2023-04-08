async function mainFlow() {
  const shadowRoot = document.querySelector("landing-page").shadowRoot;
  const connectBtn = shadowRoot.querySelector("#connectBtn");

  connectBtn.addEventListener("click", bluetoothSetup);
}

async function bluetoothSetup() {
  let thinToken = await requestThinTokenReaderService();

  btListen(thinToken, BT.STATUS_CHARACTERISTIC, (val) => {
    statusChangeHandler(val, thinToken);
  });

  btListen(thinToken, BT.OTP_CHARACTERISTIC, async (val) => {
    if (val.byteLength == 0) return;
    console.log("BT LISTEN in request acc data");
    console.log(val);

    setTimeout(() => {
      getThinTokenId(thinToken)
        .then((tagId) => {
          console.log("Done tagId");
          console.log(tagId);
          otpValueChangeHandler(val, tagId);
        })
        .catch(e => {
          console.error(e);
          window.alert("Error in getting accounts from ThinToken");
        });
    }, 200);
  });

  beginWriteMode(thinToken);

  const appContainer = document.querySelector("#app-container");
  appContainer.addEventListener("ThinToken_FormDone", (ev) => {
    addData(thinToken, ev.detail.label, ev.detail.secret);
  });

  appContainer.addEventListener("ThinToken_GetAccList", async (ev) => {
    await requestAccountData(thinToken);
  });
}

// Generates a key if there is no key for the tag
// in localStorage. If a key already exists, does nothing
async function generateAndStoreKey(thinToken) {
  let tagId = await getThinTokenId(thinToken);

  let existingKey = localStorage.getItem(tagId);

  if (existingKey == null) {
    let rawKey = await generateAes256Key();
    rawKey = new Uint8Array(rawKey);
    let obj = {
      id: tagId,
      iv: window.crypto.getRandomValues(new Uint8Array(12)),
      key: rawKey
    };
    localStorage.setItem(tagId, JSON.stringify(obj));
  }
}

function statusChangeHandler(val, thinToken) {
  if (val.byteLength != 0) {
    val = new Uint8Array(val.buffer);
    val = val[0];
    
    let statusName = Object.keys(STATUS).find(k => STATUS[k] === val);
    console.log(`${val}: ${statusName}`);

    switch (val) {
      case STATUS.TagRead:
        generateAndStoreKey(thinToken);
        break;
      case STATUS.WriteTagReady:
        if (history.state.page == "landing-page") {
          navHandler("account-list");
        }
        break;
      case STATUS.ReadQueueEmpty:
        if (history.state.page == "account-list") {
          beginWriteMode(thinToken);
        }
        break;
      case STATUS.MutexLocked:
        if (history.state.page == "account-list") {
          // If rfid is in use, wait a bit then call requestAccountData again
          setTimeout(() => {
            requestAccountData(thinToken);
          }, 1000);
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

//#region Add Form

async function addData(thinToken, label, secret) {
  console.log("Add data: ");
  console.log(label);
  console.log(secret);

  let tagId = await getThinTokenId(thinToken);

  // let rawKey = generateAes256Key();
  // let key = window.crypto.subtle.importKey(
  //   "raw",
  //   rawKey,
  //   "AES-GCM",
  //   true,
  //   ["encrypt", "decrypt"]
  // );
  // let iv = window.crypto.getRandomValues(new Uint8Array(12));
  if (localStorage.getItem(tagId) == null) {
    window.alert("Unable to encrypt/decrypt tag.");
    return;
  }

  let rawKey = JSON.parse(localStorage.getItem(tagId)).key;
  console.log(rawKey);
  rawKey = new Uint8Array(Object.values(rawKey));
  console.log(rawKey);
  let key = await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    true,
    ['encrypt', 'decrypt']
  );
  let iv = JSON.parse(localStorage.getItem(tagId)).iv;
  iv = new Uint8Array(Object.values(iv));

  // Sanitize label and secret from ',' character
  label = label.replace(',', "%2C");
  secret = secret.replace(',', "%2C");

  let btMsg = label + "," + secret;
  btMsg = new TextEncoder().encode(btMsg);

  // Encrypt btMsg
  console.log("Encrypting");
  console.log(btMsg);
  console.log("Plaintext length", btMsg.length);
  btMsg = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    }, 
    key, 
    btMsg
  ).catch(e => {console.error(e.message)});

  console.log("Sending to BT");
  const secretChar = await thinToken.getCharacteristic(BT.SECRET_CHARACTERISTIC);
  secretChar.writeValueWithoutResponse(btMsg);
}

//#endregion

//#region Account List

async function requestAccountData(thinToken) {
  try {
    console.log("Request account data");
    let statusChar = await thinToken.getCharacteristic(BT.STATUS_CHARACTERISTIC);
    await updateStatus(statusChar, STATUS.ReadAllRequested);
  } catch (error) {
    console.error("Error handled in requestAccountData");
    console.error(error);
    if (error.message == "GATT operation already in progress.") {
      console.log("Retrying...");
      setTimeout(() => {
        requestAccountData(thinToken);
      }, 250);
    }
  }
}

// During write flow, otp characteristic temporarily
// becomes the characteristic where tag contents are dumped
async function otpValueChangeHandler(val, tagId) {
  if (val.byteLength == 0) return;

  console.log("OTP Characteristic message received");
  val = new Uint8Array(val.buffer);

  console.log("Ciphertext");
  console.log(val);
  console.log(tagId);

  // Truncate val, if there are five consecutive
  // zeroes, cut the message to the start of the
  // sequence of zeores
  let lastIdx = 0;
  for (let i = 0; i < val.length - 5; i++) {
    let subs = val.subarray(i, i + 5);
    let sum = subs.reduce((acc, curr) => acc + curr);
    if (sum === 0) {
      lastIdx = i;
      break;
    }
  }
  val = val.subarray(0, lastIdx);

  // Decrypt val
  let iv = Object.values(JSON.parse(localStorage.getItem(tagId)).iv);
  iv = new Uint8Array(iv);
  let rawKey = Object.values(JSON.parse(localStorage.getItem(tagId)).key);
  rawKey = new Uint8Array(rawKey);

  console.log(iv);
  console.log(rawKey);
  let key = await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    true,
    ['encrypt', 'decrypt']
  );

  console.log(key);
  let decrypted;
  try {
    decrypted = await window.crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: iv
      },
      key,
      val
    );
  } catch (error) {
    console.error(error);
  }
  decrypted = new TextDecoder().decode(decrypted);

  console.log("Decrypted:");
  console.log(decrypted);

  appendAccount(decrypted);
}

//#endregion