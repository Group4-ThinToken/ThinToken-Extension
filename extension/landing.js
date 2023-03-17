var b = {}

if (typeof browser == "undefined") {
  console.log("Chromium");
  Object.assign(b, chrome);
} else if (typeof chrome == "undefined") {
  console.log("Firefox");
  Object.assign(b, browser);
}


let connectBtn = document.querySelector("#buttonid");
connectBtn.addEventListener("click", (event) => {
  console.log("Click!");
  b.tabs.create({ url: "landingPage.html" })
});
// let connectbtn2 = document.querySelector("#buttonid2");
// connectbtn2.addEventListener("click", (event) => {
//   console.log("Click!");
//   b.tabs.update( undefined, { url: "addForm.html" })
// });
