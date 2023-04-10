function renderConnectBtn() {
  // const totpNextBtn = document.querySelector("#totpNext");
  // const totpNextBtnWrapper = totpNextBtn.parentElement;
  // const bottomBtnsContainer = totpNextBtnWrapper.parentElement;

  // let thinTokenBtnWrapper = document.createElement("div");
  // thinTokenBtnWrapper.classList = totpNextBtnWrapper.classList;

  // let thinTokenBtn = document.createElement("div");
  // thinTokenBtnWrapper.appendChild(thinTokenBtn);
  // thinTokenBtn.classList = totpNextBtn.classList;
  // thinTokenBtn.innerText = "ThinToken";

  const totpNextBtnWrapper = document.querySelector("#totpNext").parentElement;
  const bottomBtnsContainer = totpNextBtnWrapper.parentElement;

  let thinTokenBtnWrapper = totpNextBtnWrapper.cloneNode(true);
  let thinTokenBtn = thinTokenBtnWrapper.querySelector("#totpNext");
  let thinTokenBtnText = thinTokenBtn.querySelector("span");
  thinTokenBtnWrapper.childNodes.forEach(element => {
    element.id = "";
    element.removeAttribute("jscontroller");
    element.removeAttribute("jsaction");
    element.removeAttribute("jsname");
  });
  thinTokenBtnText.innerText = "ThinToken";

  bottomBtnsContainer.insertBefore(thinTokenBtnWrapper, bottomBtnsContainer.children[1]);

  return thinTokenBtnWrapper;
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
  const totpField = document.querySelector("#totpPin");

  totpField.value = otp;
  console.log(totpField.value);
  document.querySelector("#totpNext").click();
}

function main() {
  console.log("Hello from content.js");
  const thinTokenBtn = renderConnectBtn();

  thinTokenBtn.addEventListener("click", async (ev) => {
    // const totpField = document.querySelector("#totpPin");
    // totpField.value = "11111";
    // let nextButton = document.querySelector("#totpNext");
    // nextButton.click();
    // ======

    let thinTokenService = await requestThinTokenReaderService();
    let statusCharacteristic = thinTokenService.getCharacteristic(BT.STATUS_CHARACTERISTIC);
    updateReaderTime(thinTokenService);
    updateStatus(await statusCharacteristic, STATUS.OtpRequested);

    btListen(thinTokenService, BT.STATUS_CHARACTERISTIC, (value) => {
      console.log("STATUS:");
      console.log(value);
      statusChangeHandler(val);
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

function statusChangeHandler(val) {
  if (val.byteLength != 0) {
    val = new Uint8Array(val.buffer);
    val = val[0];
    
    let statusName = Object.keys(STATUS).find(k => STATUS[k] === val);
    console.log(`${val}: ${statusName}`);

    switch (val) {
      case STATUS.TagRead:
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

window.addEventListener("load", (ev) => {
  main();
});


// generateAes256Key();
