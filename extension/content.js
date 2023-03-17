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

function main() {
  console.log("Hello from content.js");
  const thinTokenBtn = renderConnectBtn();

  thinTokenBtn.addEventListener("click", (ev) => {
    requestThinTokenReaderService();
  });
}

window.addEventListener("load", (ev) => {
  main();
});


// generateAes256Key();
