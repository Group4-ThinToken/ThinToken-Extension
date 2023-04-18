var global_needsOtpRequest = false;
var nextCount = 0;
var hasMainRun = false;

function renderConnectBtn() {

  // const totpNextBtnWrapper = document.querySelectorAll("[data-id='dtOep']")[1].parentElement;
  // const bottomBtnsContainer = totpNextBtnWrapper.parentElement;

  // let thinTokenBtnWrapper = totpNextBtnWrapper.cloneNode(true);
  // let thinTokenBtn = thinTokenBtnWrapper.querySelectorAll("[data-id='dtOep']")[1];
  // console.log(thinTokenBtn);
  // let thinTokenBtnText = thinTokenBtn.querySelector("span");
  // thinTokenBtnWrapper.childNodes.forEach(element => {
  //   element.id = "";
  //   element.removeAttribute("jscontroller");
  //   element.removeAttribute("jsaction");
  //   element.removeAttribute("jsname");
  // });
  // thinTokenBtnText.innerText = "ThinToken";

  // bottomBtnsContainer.insertBefore(thinTokenBtnWrapper, bottomBtnsContainer.children[1]);

  // return thinTokenBtnWrapper;

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
function enterTotp(otp) {
  if (nextCount != 1) throw Error("Invalid nextCount value");
  const totpField = document.querySelector("[placeholder='Enter Code']");

  totpField.value = otp;
  console.log(totpField.value);
  let confirmSpan = Array.from(document.querySelectorAll("button > span"))
                  .filter(el => el.innerText == "Verify");
  confirmSpan = confirmSpan[confirmSpan.length - 1];

  let confirmBtn = confirmSpan.parentElement;
  confirmBtn.click();
}

function main() {
  console.log("Hello from content.js");
  const thinTokenBtn = renderConnectBtn();

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
            thinToken.device.gatt.disconnect();
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
  // document.querySelector("[jsname='V67aGc']")
  //   .addEventListener("click", ev => {
  //     setTimeout(() => {
  //       main();
  //     }, 250);
  //   });

  const observer = new MutationObserver((mutationList, observer) => {
    const totpField = document.querySelector("[placeholder='Enter Code']");
    if (!hasMainRun && totpField) {
      main();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
});


// generateAes256Key();
