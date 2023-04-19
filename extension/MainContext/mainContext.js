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
  "landing-page": onLandingPageLoaded,
  "add-form": onAddFormLoaded,
  "account-list": onAccountListLoaded
};

window.addEventListener("load", () => {
  history.replaceState({ page: "landing-page" }, "unused", "?component=landing-page");
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

  window.addEventListener("popstate", (ev) => {
    loadComponent(ev.state.page);
  });

  let navBtns = document.querySelectorAll(".navLink");
  navBtns.forEach(el => {
    let splittedId = el.id.split("-");

    el.addEventListener("click", (ev) => {
      navHandler(`${splittedId[1]}-${splittedId[2]}`);
    });
  });

  let btContainer = shadow.querySelector("#bt-container");
  window.addEventListener("ThinToken_Connected", (ev) => {
    btContainer.classList.add(["bt-on"]);
  });

  window.addEventListener("ThinToken_Disconnected", (ev) => {
    btContainer.classList.remove(["bt-on"]);
  });

  onLandingPageLoaded(document.querySelector("landing-page").shadowRoot);
}

function navHandler(componentName) {
  console.log("Nav handler");
  console.log(componentName);

  if (!componentNames.includes(componentName)) {
    console.error("Invalid navigation link");
    return;
  }

  history.pushState({
    page: componentName 
  }, "unused-param", `?component=${componentName}`);

  loadComponent(componentName);
}

function loadComponent(componentName) {
  let container = document.getElementById("app-container");
  // Replace the tag in main.html
  container.innerHTML = `<${componentName} />`;

  // Run the script file of the component
  componentNameScripts[componentName](document.querySelector(componentName).shadowRoot);
}