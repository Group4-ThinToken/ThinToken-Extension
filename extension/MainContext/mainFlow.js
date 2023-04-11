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

  const appContainer = document.querySelector("#app-container");
  appContainer.addEventListener("ThinToken_FormDone", async (ev) => {
    await beginWriteMode(thinToken);
    addData(thinToken, ev.detail.label, ev.detail.secret)
  });


  appContainer.addEventListener("ThinToken_GetAccList", async (ev) => {
    await requestAccountData(thinToken);
  });
}

// Generates a key if there is no key for the tag
// in localStorage. If a key already exists, does nothing
async function generateAndStoreKey(thinToken) {
  let tagId = await getThinTokenId(thinToken);

  // let existingKey = localStorage.getItem(tagId);
  let existingKey = await b.storage.local.get(tagId);

  if (Object.keys(existingKey).length == 0) {
    let rawKey = await generateAes256Key();
    rawKey = new Uint8Array(rawKey);
    let obj = {
      id: tagId,
      iv: Array.from(window.crypto.getRandomValues(new Uint8Array(12))),
      key: Array.from(rawKey)
    };
    console.log(obj)
    // localStorage.setItem(tagId, JSON.stringify(obj));
    await b.storage.local.set({ [tagId]: obj });
  } else {
    console.log("Reusing existing key");
  }
}

async function statusChangeHandler(val, thinToken) {
  if (val.byteLength != 0) {
    val = new Uint8Array(val.buffer);
    id = val.slice(1, 5).join("");
    arg = val[5]; // Typically used for sector written to in writesuccess
    val = val[0];
    
    let statusName = Object.keys(STATUS).find(k => STATUS[k] === val);
    console.log(`${val}: ${statusName}`);

    switch (val) {
      case STATUS.TagRead:
        generateAndStoreKey(thinToken);
        if (history.state.page == "landing-page") {
          navHandler("account-list");
        }
        break;
      case STATUS.WriteSuccess:
        let localKeyIvObject = await b.storage.local.get(id);
        localKeyIvObject = localKeyIvObject[id];
        let lastLabel = await b.storage.local.get("lastLabel");
        lastLabel = lastLabel.lastLabel;
        console.log(lastLabel);
        console.log(localKeyIvObject);

        localKeyIvObject[lastLabel] = arg;
        b.storage.local.set({ [id]: localKeyIvObject });

        window.alert("Account added succefully");
        break;
      case STATUS.WriteFailed:
        window.alert("Not enough space in ThinToken");
      case STATUS.WriteTagReady:
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
  console.log("Begin write mode");
  const status = await thinToken.getCharacteristic(BT.STATUS_CHARACTERISTIC);
  let req = new Uint8Array(new ArrayBuffer(1));
  req[0] = STATUS.WriteFlowRequested;
  await status.writeValueWithResponse(req);
}

async function endWriteMode(thinToken) {
  console.log("End write mode");
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

  if (label == "") {
    window.alert("Label cannot be empty");
    return;
  }

  if (secret == "") {
    window.alert("Secret cannot be empty");
    return;
  }

  // Store label on local storage lastLabel
  // so we can store sector data later
  let lastLabelStore = b.storage.local.set({ lastLabel: label });

  let tagId = await getThinTokenId(thinToken);

  // if (localStorage.getItem(tagId) == null) {
  let localKeyIvObject = await b.storage.local.get(tagId);
  if (Object.keys(localKeyIvObject).length == 0) {
    window.alert("Unable to encrypt/decrypt tag.");
    return;
  }
  localKeyIvObject = localKeyIvObject[tagId]; // This is necessary because get returns {[tagId]: {...}}

  console.log(localKeyIvObject);
  let rawKey = localKeyIvObject.key;
  console.log(rawKey);
  rawKey = new Uint8Array(rawKey);
  console.log(rawKey);
  let key = await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    true,
    ['encrypt', 'decrypt']
  );
  let iv = localKeyIvObject.iv;
  iv = new Uint8Array(Object.values(iv));

  btListen(thinToken, BT.SECTOR_CHARACTERISTIC, (val) => {
    localKeyIvObject[label] = val;
    // localStorage.setItem(tagId, JSON.stringify(localKeyIvObject));
    b.storage.local.set({ [tagId]: localKeyIvObject });
  });

  // Sanitize label and secret from ',' character
  label = label.replaceAll(',', "%2C");
  secret = secret.replaceAll(',', "%2C");

  let btMsg = label + "," + secret;
  
  btMsg = btMsg.replaceAll(' ', '');
  btMsg += " "; // Add space at the end as a stop byte
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
  await lastLabelStore;
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
  let localKeyIvObject = await b.storage.local.get(tagId);
  console.log(localKeyIvObject);
  if (Object.keys(localKeyIvObject).length == 0) {
    window.alert("Unable to decrypt ThinToken.");
    throw Error("Unable to decrypt ThinToken.");
  }
  localKeyIvObject = localKeyIvObject[tagId];

  let iv = localKeyIvObject.iv;
  iv = new Uint8Array(iv);
  let rawKey = localKeyIvObject.key;
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
    throw error;
  }
  decrypted = new TextDecoder().decode(decrypted);

  console.log("Decrypted:");
  console.log(decrypted);

  appendAccount(decrypted);
}

//#endregion