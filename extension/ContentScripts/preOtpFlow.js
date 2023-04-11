function emailGetter() {
  // TODO: Add matches to manifest to run content script
  // in email field
  const emailField = document.querySelector("input[type='email']");
  
  if (!emailField) {
    return;
  };

  // localStorage.setItem("lastLabel", emailField.value);
  b.storage.local.set({ lastLabel: emailField.value });
}

function main() {
  const emailNextBtn = document.querySelector("#identifierNext");

  emailNextBtn.addEventListener("click", (ev) => {
    emailGetter();
  });
}

window.addEventListener("load", (ev) => {
  main();
});