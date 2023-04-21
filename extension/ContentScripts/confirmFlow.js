var global_needsOtpRequest = false;
var nextCount = 0;
var hasMainRun = false;

function renderConnectBtn() {

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

  thinTokenContainer.style.position = "absolute";
  thinTokenContainer.style.left = "5vw";
  thinTokenContainer.style.top = "15vh";
  thinTokenContainer.style.zIndex = "10000";

  connectBtn.style.backgroundColor = "#FF4F63";
  connectBtn.style.height = "30px";
  connectBtn.style.padding = "0px 4px";
  connectBtn.style.borderRadius = "10px";
  connectBtn.style.fontSize = "20px";
  connectBtn.style.cursor = "pointer";

  thinTokenContainer.appendChild(connectBtn);
  document.querySelector("[class*='modal']").appendChild(thinTokenContainer);

  return thinTokenContainer;
}

async function findLabelSectorFromLocalStorage(tagId) {
  // let lastLabel = localStorage.getItem("lastLabel");
  let lastLabel = await b.storage.local.get("lastLabel");
  if (!lastLabel) {
    return;
  }

  // let localKeyIvObject = JSON.parse(localStorage.getItem(tagId));
  let localKeyIvObject = await b.storage.local.get(tagId);
  localKeyIvObject = localKeyIvObject[tagId];
  let sector = localKeyIvObject[lastLabel];
  return sector;
}

// Function takes string
// For google
function enterTotp(otp) {
  if (nextCount != 1) throw Error("Invalid nextCount value");
  let currUrl = window.location.toString();

  console.log(currUrl);

  if (currUrl.search("google") != -1) {
    enterTotpGoogle(otp);
  } else if (currUrl.search("yahoo") != -1) {
    enterTotpYahoo(otp);
  }

  btDisconnect();
}

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
  const totpField = document.querySelectorAll(".code-input-container .char-input-field input");
  for (let i = 0; i < totpField.length; i++) {
    console.log(otp[i]);
    console.log(totpField[i]);
    totpField[i].value = otp[i];
  }

  let confirmBtn = document.querySelector("#btnTsvAuthenticatorVerifyCode");
  setTimeout(() => {
    confirmBtn.click();
  }, 1000);
}

function main() {
  console.log("Hello from content.js");
  let thinTokenBtn;

  try {
    thinTokenBtn = renderConnectBtn();
  } catch (error) {
    thinTokenBtn = renderConnectDefaultBtn();
  }

  if (!thinTokenBtn) return;
  hasMainRun = true;

  // const setUpBtn = document.querySelector("[jsname='LgbsSe']");
  // console.log(setUpBtn);
  // if (!setUpBtn) return;

  console.log("Adding event listener");
  thinTokenBtn.addEventListener("click", async (ev) => {
    // const totpField = document.querySelector("#totpPin");
    // totpField.value = "11111";
    // let nextButton = document.querySelector("#totpNext");
    // nextButton.click();
    // ======

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

        enterTotp(new Uint32Array(value.buffer)[0].toString().padStart(6, "0"));
      }
    });
  });
}

// TODO: Use 

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

  let _sectorCharacteristic = await thinToken.getCharacteristic(BT.SECTOR_CHARACTERISTIC);
  let _secretCharacteristic = await thinToken.getCharacteristic(BT.SECRET_CHARACTERISTIC);

  let tagId = await getThinTokenId();
  let localKeyIvObject = await b.storage.local.get(tagId);
  localKeyIvObject = localKeyIvObject[tagId];

  let secretPayload = new Uint8Array(localKeyIvObject.iv.concat(localKeyIvObject.key));
  await _secretCharacteristic.writeValueWithoutResponse(secretPayload);

  let sectorPayload = new Uint8Array(2);
  sectorPayload[0] = localKeyIvObject[lastLabel];
  sectorPayload[1] = 0xFF;
  await _sectorCharacteristic.writeValueWithResponse(sectorPayload);
}

window.addEventListener("load", (ev) => {
  console.log("Pre main content.js");
  const observer = new MutationObserver((mutationList, observer) => {
    const totpField = document.querySelector("[placeholder='Enter Code']");
    const yahooMailTotp = document.querySelector(".tsv-authenticator-setup-option");
    if (!hasMainRun && (totpField || yahooMailTotp)) {
      main();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
});