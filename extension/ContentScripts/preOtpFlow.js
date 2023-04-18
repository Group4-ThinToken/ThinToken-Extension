function emailGetter() {
  // TODO: Add matches to manifest to run content script
  // in email field
  const emailField = document.querySelector("input[type='email']");
  
  if (!emailField) {
    return;
  };
  console.log("Email field value", emailField.value);
  // localStorage.setItem("lastLabel", emailField.value);
  b.storage.local.set({ lastLabel: emailField.value });
}

function main() {
  const emailNextBtn = document.querySelector("#identifierNext");

  emailNextBtn.addEventListener("click", (ev) => {
    emailGetter();
  });

  document.addEventListener("keyup", (ev) => {
    if (ev.key == "Enter") {
      emailGetter();
      document.removeEventListener("keyup");
    }
  });
}

window.addEventListener("load", (ev) => {
  console.log("Pre otp flow");
  main();
});