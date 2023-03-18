async function generateAes256Key() {
  console.log("Generating AES key")
  let key = await window.crypto.subtle.generateKey({
    name: "AES-GCM",
    length: 256
  },
    true,
    ['encrypt', 'decrypt']);

  console.log(key);

  let rawKey = await window.crypto.subtle.exportKey(
    "raw",
    key
  )

  console.log(rawKey);

  return rawKey;
}

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
    updateReaderTime(thinTokenService);

    btListen(thinTokenService, BT.STATUS_CHARACTERISTIC, (value) => {
      console.log("STATUS:");
      console.log(value);
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

window.addEventListener("load", (ev) => {
  main();
});


// generateAes256Key();
