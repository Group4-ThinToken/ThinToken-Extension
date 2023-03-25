const componentHtmlFiles = [
  "../LandingPage/landingPage.html",
  "../AddForm/addForm.html",
  "../AccountList/accountList.html"
];

const componentParentDirs = [
  "../LandingPage/",
  "../AddForm/",
  "../AccountList/"
];

const componentNames = [
  "landing-page",
  "add-form",
  "account-list"
];

const componentNameScripts = {
  "landing-page": () => {},
  "add-form": onAddFormLoaded,
  "account-list": onAccountListLoaded
};

window.addEventListener("load", () => {
  main();
});

async function fetchPages() {
  let htmlText = Promise.all(componentHtmlFiles.map(c => {
    return fetch(c).then(stream => stream.text());
  }));

  return htmlText;
}

function define(html, componentTag) {
  class Component extends HTMLElement {
    constructor() {
      super();

      var shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = html;

      let navBtns = shadow.querySelectorAll(".navLink");
      navBtns.forEach(el => {
        let splittedId = el.id.split("-");

        el.addEventListener("click", (ev) => {
          navHandler(`${splittedId[1]}-${splittedId[2]}`);
        });
      });
    }
  }

  customElements.define(componentTag, Component);
}

async function main() {
  const componentHtmls = await fetchPages();
  console.log(componentHtmls);

  for (i = 0; i < componentNames.length; i++) {
    define(componentHtmls[i], componentNames[i]);
  }

  mainFlow();
}

function navHandler(componentName) {
  console.log("Nav handler");
  console.log(componentName);

  if (!componentNames.includes(componentName)) {
    console.error("Invalid navigation link");
    return;
  }

  // history.pushState({
  //   page: componentName
  // }, "unused-param");

  let container = document.getElementById("app-container");
  // Clear all contents of container
  container.innerHTML = `<${componentName} />`;

  // // Add the new component
  // let component = document.createElement(componentName);
  // container.appendChild(component);

  componentNameScripts[componentName](document.querySelector(componentName).shadowRoot);
}