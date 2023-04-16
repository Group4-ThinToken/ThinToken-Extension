const instructionTexts = {
  notConnected: "Connect to your ThinToken Reader to begin.",
  isConnected: "Place your ThinToken RFID Tag to the ThinToken Reader."
}

function onLandingPageLoaded(shadowRoot) {
  console.log("Landing page script loaded");
  const instruction = shadowRoot.getElementById("instruction")

  window.addEventListener("ThinToken_Disconnected", (ev) => {
    instruction.classList += " pre-animation";
    instruction.innerText = instructionTexts.notConnected;
    setTimeout(() => {
      instruction.classList = "";
    }, 256);
  });

  window.addEventListener("ThinToken_Connected", (ev) => {
    console.log("ThinToken Reader Connected");
    instruction.classList += " pre-animation";
    instruction.innerText = instructionTexts.isConnected;
    setTimeout(() => {
      instruction.classList = "";
    }, 256);
  });

  mainFlow();
}