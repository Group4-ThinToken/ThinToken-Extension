var global_needsOtpRequest = false;

function renderConnectBtnGoogle() {
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

function renderConnectBtnYahoo() {
  // const otpInputField = document.querySelector("#verification-code-field");
  const submitButton = document.querySelector("#verify-code-button");
  const submitContainer = submitButton.parentElement;
  const formElement = submitContainer.parentElement;

  const thinTokenBtnWrapper = submitContainer.cloneNode(true);
  const thinTokenBtn = thinTokenBtnWrapper.querySelector("button");
  thinTokenBtnWrapper.appendChild(thinTokenBtn);
  thinTokenBtn.innerText = "ThinToken";

  thinTokenBtn.id = "thintoken-connect";
  thinTokenBtn.name = "thintokenConnect";
  thinTokenBtn.setAttribute("type", "button");
  thinTokenBtn.removeAttribute("data-ylk");
  thinTokenBtn.removeAttribute("data-rapid-tracking");
  thinTokenBtn.removeAttribute("value");
  
  formElement.insertBefore(thinTokenBtnWrapper, submitContainer);

  return thinTokenBtnWrapper;
}

function renderConnectBtnFacebook() {
  const submitButton = document.querySelector("#checkpointSubmitButton");
  if (submitButton.innerText != "Submit code") {
    return;
  }
  const bottomBtnsContainer = submitButton.parentElement;

  const thinTokenBtn = submitButton.cloneNode(true);
  thinTokenBtn.innerText = "ThinToken";

  thinTokenBtn.id = "thintoken-connect";
  thinTokenBtn.value = "";
  thinTokenBtn.name = "thintokenConnect";
  thinTokenBtn.setAttribute("type", "button");

  bottomBtnsContainer.insertBefore(thinTokenBtn, submitButton);

  return thinTokenBtn;
}

function renderConnectBtnOffice() {
  const submitButton = document.querySelector("#idSubmit_SAOTCC_Continue");
  const submitContainer = submitButton.parentElement;
  const bottomBtnsContainer = submitContainer.parentElement;

  if (!submitButton || !submitContainer || !bottomBtnsContainer) {
    return;
  }

  const thinTokenBtnWrapper = submitContainer.cloneNode(true);
  const thinTokenBtn = thinTokenBtnWrapper.querySelector("input");

  thinTokenBtn.id = "thintoken-connect";
  thinTokenBtn.name = "thintokenConnect";
  thinTokenBtn.setAttribute("type", "button");
  thinTokenBtn.removeAttribute("data-report-event");
  thinTokenBtn.removeAttribute("data-report-trigger");
  thinTokenBtn.removeAttribute("data-report-value");
  thinTokenBtn.removeAttribute("data-bind");
  thinTokenBtn.value = "ThinToken";

  bottomBtnsContainer.insertBefore(thinTokenBtnWrapper, submitContainer);

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

function enterTotpYahoo(otp) {
  const totpField = document.querySelector("#verification-code-field");
  totpField.style.color = "white";

  totpField.value = otp;
  console.log(totpField.value);
  console.log(document.querySelector("#verify-code-button"));
  document.querySelector("#verify-code-button").click();
}

// Function takes string
function enterTotpGoogle(otp) {
  const totpField = document.querySelector("#totpPin");

  totpField.value = otp;
  console.log(totpField.value);
  document.querySelector("#totpNext").click();
}

function enterTotpFacebook(otp) {
  const totpField = document.querySelector("#approvals_code");
  totpField.style.color = "white";
  totpField.value = otp;
  document.querySelector("#checkpointSubmitButton").click();
}

function enterTotpMicrosoft(otp) {
  const totpField = document.querySelector("#idTxtBx_SAOTCC_OTC");
  totpField.focus();
  totpField.value = otp;
  totpField.dispatchEvent(new Event("change"));
  document.querySelector("input[type='submit']").click();
}

function main() {
  console.log("Hello from content.js");
  let thinTokenBtn;

  const currUrl = window.location.toString();
  if (currUrl.search("google") != -1) {
    thinTokenBtn = renderConnectBtnGoogle();
  } else if (currUrl.search("yahoo") != -1) {
    thinTokenBtn = renderConnectBtnYahoo();
  } else if (currUrl.search("facebook") != -1) {
    thinTokenBtn = renderConnectBtnFacebook();
  } else if (currUrl.search("microsoftonline") != -1) {
    if (!document.querySelector("#idSubmit_SAOTCC_Continue")) {
      return;
    }
    thinTokenBtn = renderConnectBtnOffice();
  }

  thinTokenBtn.addEventListener("click", async (ev) => {
    // const totpField = document.querySelector("#totpPin");
    // totpField.value = "11111";
    // let nextButton = document.querySelector("#totpNext");
    // nextButton.click();
    // ======
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

        let totpString = new Uint32Array(value.buffer)[0].toString().padStart(6, "0");
        if (currUrl.search("google") != -1) {
          enterTotpGoogle(totpString);
        } else if (currUrl.search("yahoo") != -1) {
          enterTotpYahoo(totpString);
        } else if (currUrl.search("facebook") != -1) {
          enterTotpFacebook(totpString);
        } else if (currUrl.search("microsoft") != -1) {
          enterTotpMicrosoft(totpString);
        }
      }
    });
  });
}

// TODO: Use 

async function statusChangeHandler(val, thinToken, lastLabel) {
  if (val.byteLength != 0) {
    val = new Uint8Array(val.buffer);
    id = val.slice(1, 5).join("");
    val = val[0];
    
    let statusName = Object.keys(STATUS).find(k => STATUS[k] === val);
    console.log(`${val}: ${statusName}`);

    switch (val) {
      case STATUS.TagRead:
        if (global_needsOtpRequest) {
          try {
            let statusCharacteristic = await thinToken.getCharacteristic(BT.STATUS_CHARACTERISTIC);
            await updateThinTokenId(id);
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
  console.log("sectorNum:", sectorNum);
  if (!sectorNum) {
    window.alert("Invalid ThinToken Tag");
    throw Error("Invalid tag");
  }
  sectorPayload[0] = sectorNum;
  sectorPayload[1] = 0xFF;
  await _sectorCharacteristic.writeValueWithResponse(sectorPayload);
}

window.addEventListener("load", (ev) => {
  main();
});

if (window.location.hostname.search("microsoftonline") != -1) {
  const observer = new MutationObserver((mutationList, o) => {
    if (!document.querySelector("#thintoken-connect") && document.querySelector("#idSubmit_SAOTCC_Continue")) {
      // Perform emailGetter on otpFlow since for microsoft login page
      // there is an element containing the email on the same page as otp
      let currHostname = window.location.hostname.toString();
      currHostname = currHostname.split(".");
      currHostname = `${currHostname[currHostname.length-2]}.${currHostname[currHostname.length-1]}`;
      const emailField = document.querySelector("#displayName");
      console.log("Email field value", emailField.innerText);
      b.storage.local.set({ lastLabel: `${emailField.innerText}-${currHostname}` });

      main();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
}