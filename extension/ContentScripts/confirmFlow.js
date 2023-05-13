var global_needsOtpRequest = false;
var nextCount = 0;
var hasMainRun = false;

function renderConnectBtnGoogle() {

  let cancelSpan = Array.from(document.querySelectorAll("button > span"))
                  .filter(el => el.innerText == "Cancel");
  cancelSpan = cancelSpan[cancelSpan.length - 1];

  let cancelContainer = cancelSpan.parentElement.parentElement;

  console.log(cancelContainer);

  let thinTokenContainer = cancelContainer.cloneNode(true);
  thinTokenContainer.childNodes.forEach(element => {
    element.id = "";
    element.removeAttribute("jscontroller");
    element.removeAttribute("jsaction");
    element.removeAttribute("jsname");
  });
  let thinTokenText = thinTokenContainer.querySelector("span");
  thinTokenText.innerText = "ThinToken";

  let bottomBtnsContainer = cancelContainer.parentElement;
  bottomBtnsContainer.insertBefore(thinTokenContainer, bottomBtnsContainer.children[0]);

  return thinTokenContainer;
}

function renderConnectDefaultBtn() {
  let thinTokenContainer = document.createElement("div");
  let connectBtn = document.createElement("button");
  connectBtn.innerText = "ThinToken";

  thinTokenContainer.id = "thintoken-btn";
  thinTokenContainer.style.position = "fixed";
  thinTokenContainer.style.right = "18%";
  thinTokenContainer.style.top = "2%";
  thinTokenContainer.style.zIndex = "9999999";

  connectBtn.style.backgroundColor = "#FF4F63";
  connectBtn.style.height = "30px";
  connectBtn.style.padding = "0px 4px";
  connectBtn.style.borderRadius = "10px";
  connectBtn.style.fontSize = "20px";
  connectBtn.style.cursor = "pointer";

  thinTokenContainer.appendChild(connectBtn);
  document.querySelector("body").appendChild(thinTokenContainer);

  return thinTokenContainer;
}

async function findLabelSectorFromLocalStorage(tagId) {
  let lastLabel = await b.storage.local.get("lastLabel");
  if (!lastLabel) {
    return;
  }

  let localKeyIvObject = await b.storage.local.get(tagId);
  localKeyIvObject = localKeyIvObject[tagId];
  let sector = localKeyIvObject[lastLabel];
  return sector;
}

// Function takes string
function preEnterTotp(otp) {
  if (nextCount != 1) throw Error("Invalid nextCount value");
  let currUrl = window.location.toString();

  console.log(currUrl);

  if (currUrl.search("google") != -1) {
    enterTotpGoogle(otp);
  } else if (currUrl.search("yahoo") != -1) {
    enterTotpYahoo(otp);
  } else if (currUrl.search("facebook") != -1) {
    enterTotpFacebook(otp);
  } else if (currUrl.search("microsoft") != -1) {
    enterTotpMicrosoft(otp);
  }

  const thinTokenContainer = document.querySelector("#thintoken-btn");
  if (thinTokenContainer) {
    thinTokenContainer.remove();
  }
  btDisconnect();
}

// For google
function enterTotpGoogle(otp) {
  const totpField = document.querySelector("[placeholder='Enter Code']");
  totpField.value = otp;
  console.log(totpField.value);
  let confirmSpan = Array.from(document.querySelectorAll("button > span"))
                  .filter(el => el.innerText == "Verify");
  confirmSpan = confirmSpan[confirmSpan.length - 1];

  let confirmBtn = confirmSpan.parentElement;
  confirmBtn.click();
}

function enterTotpYahoo(otp) {
  const totpField = document.querySelector(".code-input-container .char-input-field input");

  totpField.focus();
  navigator.clipboard.writeText(otp)
    .then(() => {
      document.execCommand("paste");
    })
  document.querySelector("#btnTsvAuthenticatorVerifyCode").click();
}

function enterTotpFacebook(otp) {
  console.log("totp fb");
  const totpField = document.querySelector("input");
  totpField.style.color = "white";

  totpField.focus();
  navigator.clipboard.writeText(otp)
    .then(() => {
      document.execCommand("paste");
    });
}

function enterTotpMicrosoft(otp) {
  const totpField = document.querySelector("input[placeholder='Enter code']");

  totpField.focus();
  navigator.clipboard.writeText(otp)
    .then(() => {
      document.execCommand("paste");
    });

    [...document.querySelectorAll(".ms-Dialog-action > button[type='button'] span")].find(e => e.innerText == "Next").click();
}

function main() {
  console.log("Hello from content.js");
  let thinTokenBtn;

  let currHostname = window.location.hostname.toString();
  currHostname = currHostname.split(".");
  currHostname = `${currHostname[currHostname.length-2]}.${currHostname[currHostname.length-1]}`;
  if (currHostname == "microsoft.com") {
    currHostname = "microsoftonline.com";
  }
  b.storage.local.set({ lastHostname: currHostname });

  try {
    thinTokenBtn = renderConnectBtnGoogle();
  } catch (error) {
    thinTokenBtn = renderConnectDefaultBtn();
  }

  if (!thinTokenBtn) return;
  hasMainRun = true;

  console.log("Adding event listener");
  thinTokenBtn.addEventListener("click", async (ev) => {
    nextCount = 1;
    global_needsOtpRequest = true;
    let thinTokenService = await requestThinTokenReaderService();
    let lastLabel = await b.storage.local.get("lastLabel");
    lastLabel = lastLabel["lastLabel"];
    updateReaderTime(thinTokenService);

    btListen(thinTokenService, BT.STATUS_CHARACTERISTIC, (value) => {
      statusChangeHandler(value, thinTokenService, lastLabel);
    });

    btListen(thinTokenService, BT.OTP_CHARACTERISTIC, (value) => {
      if (value.byteLength != 0) {
        console.log("OTP:")
        console.log(value.buffer);

        preEnterTotp(new Uint32Array(value.buffer)[0].toString().padStart(6, "0"));
      }
    });
  });
}

async function statusChangeHandler(val, thinToken, lastLabel) {
  if (val.byteLength != 0) {
    val = new Uint8Array(val.buffer);
    val = val[0];

    let statusName = Object.keys(STATUS).find(k => STATUS[k] === val);
    console.log(`${val}: ${statusName}`);

    switch (val) {
      case STATUS.TagRead:
        if (global_needsOtpRequest) {
          try {
            let statusCharacteristic = await thinToken.getCharacteristic(BT.STATUS_CHARACTERISTIC);
            await updateStatus(statusCharacteristic, STATUS.OtpRequested);
            await requestOtp(thinToken, lastLabel);
            global_needsOtpRequest = false;
          } catch (error) {
            console.log(error);
            global_needsOtpRequest = true;
          }
        }
        break;
      case STATUS.OtpFailed:
        window.alert("ThinToken OTP Request failed.");
        break;
      case STATUS.ReadQueueEmpty:
        break;
      case STATUS.MutexLocked:
        break;
      default:
        break;
    }
  }
}

async function requestOtp(thinToken, lastLabel) {
  // To request OTP, write the following to
  // sector characteristic:
  // DATA: 0xXX, 0xFF
  // where XX is where the sector of the requested OTP resides

  // The secret payload will be structured this way
  // DATA: [0:12) - IV
  // DATA: [12:44) - Key
  if (!lastLabel) throw Error("Last label is null.");
  let hostname = window.location.hostname.toString();
  hostname = hostname.split(".");
  hostname = `${hostname[hostname.length-2]}.${hostname.length-1}}`;

  let _sectorCharacteristic = await thinToken.getCharacteristic(BT.SECTOR_CHARACTERISTIC);
  let _secretCharacteristic = await thinToken.getCharacteristic(BT.SECRET_CHARACTERISTIC);

  let tagId = await getThinTokenId();
  let localKeyIvObject = await b.storage.local.get(tagId);
  localKeyIvObject = localKeyIvObject[tagId];

  let secretPayload = new Uint8Array(localKeyIvObject.iv.concat(localKeyIvObject.key));
  await _secretCharacteristic.writeValueWithoutResponse(secretPayload);

  let sectorPayload = new Uint8Array(2);
  let sectorNum = localKeyIvObject[`${lastLabel}-${hostname}`] || localKeyIvObject[lastLabel];
  sectorPayload[0] = sectorNum;
  sectorPayload[1] = 0xFF;
  await _sectorCharacteristic.writeValueWithResponse(sectorPayload);
}

console.log("Pre main content.js");
const observer = new MutationObserver((mutationList, observer) => {
  const totpField = document.querySelector("[placeholder='Enter Code']");
  const yahooMailTotp = document.querySelector(".tsv-authenticator-setup-option");
  const fbPrompt = [...document.querySelectorAll("div:not(:has(*))")].findIndex(e => e.innerText == "Enter confirmation code") != -1
  const microsoftPrompt = document.querySelector("#secretKeyLabel");
  if (!hasMainRun && (totpField || yahooMailTotp || fbPrompt || microsoftPrompt)) {
    main();
  }
});

observer.observe(document, {
  childList: true,
  subtree: true
});