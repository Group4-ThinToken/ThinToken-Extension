function emailGetter() {
  const currUrl = window.location.toString();
  let currHostname = window.location.hostname.toString();
  currHostname = currHostname.split(".");
  currHostname = `${currHostname[currHostname.length-2]}.${currHostname[currHostname.length-1]}`;
  let emailField;

  if (currUrl.search("google") != -1) {
    emailField = document.querySelector("input[type='email']");
  } else if (currUrl.search("yahoo") != -1) {
    emailField = document.querySelector("#login-username");
  } else if (currUrl.search("facebook") != -1) {
    emailField = document.querySelector("#email");
  }
  
  if (!emailField) {
    return;
  };
  console.log("Email field value", emailField.value);
  // localStorage.setItem("lastLabel", emailField.value);
  b.storage.local.set({ lastLabel: `${emailField.value}-${currHostname}` });
}

function main() {
  const emailNextBtn = document.querySelector("#identifierNext") ||
                       document.querySelector("input[type='submit']") ||
                       document.querySelector("button[type='submit']");

  emailNextBtn.addEventListener("click", (ev) => {
    console.log("click");
    emailGetter();
  });

  document.addEventListener("keyup", (ev) => {
    if (ev.key == "Enter") {
      emailGetter();
    }
  });
}

window.addEventListener("load", (ev) => {
  console.log("Pre otp flow");
  main();
});