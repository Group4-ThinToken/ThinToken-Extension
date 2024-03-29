var global_accountList_shadowRoot;

function getIconClass(accountName) {
  const iconClasses = {
    Facebook: "fab fa-facebook",
    Google: "fab fa-google",
    Twitter: "fab fa-twitter",
    Microsoft: "fab fa-microsoft",
    Yahoo: "fab fa-yahoo"
  };

  return iconClasses[accountName] || "fas fa-question-circle";
}

function createAccountCard(account, shadowRoot) {
  const card = document.createElement("div");
  card.className = "accountCard";

  const iconContainer = document.createElement("div");
  iconContainer.className = "icon";
  const icon = document.createElement("i");
  icon.className = getIconClass(account.accountName);
  iconContainer.appendChild(icon);
  card.appendChild(iconContainer);

  const accountName = document.createElement("div");
  accountName.className = "accountName";
  accountName.textContent = account.accountName;

  card.appendChild(accountName);

  const accountEmail = document.createElement("div");
  accountEmail.className = "accountEmail";
  accountEmail.textContent = account.accountEmail;
  card.appendChild(accountEmail);

  const deleteBtn = document.createElement("div");
  deleteBtn.className = "icon delete-icon";
  const iconDel = document.createElement("i");
  iconDel.className = "fa-solid fa-trash";
  deleteBtn.appendChild(iconDel);
  card.appendChild(deleteBtn);

  deleteBtn.addEventListener("click", (ev) => {
    console.log("Click");
    let labelStr = account.accountEmail;
    if (account.hostname) {
      labelStr += "-";
      labelStr += account.hostname;
    }
    shadowRoot.dispatchEvent(new CustomEvent("ThinToken_DeleteAcc", {
      bubbles: true,
      composed: true,
      detail: {
        label: labelStr
      }
    }));
  });

  return card;
}

function displayAccounts(accounts, shadowRoot) {
  const accountListing = shadowRoot.getElementById("accountlisting");
  accountListing.innerHTML = "";
  accounts.forEach(account => {
    const accountCard = createAccountCard(account, shadowRoot);
    accountListing.appendChild(accountCard);
  });
}

// Test data
let accounts = [
  {
    accountName: "Facebook",
    accountEmail: "example@facebook.com",
  },
  {
    accountName: "Google",
    accountEmail: "example@google.com",
  },
  {
    accountName: "Twitter",
    accountEmail: "example@twitter.com",
  }
];

function onAccountListLoaded(shadowRoot) {
  global_accountList_shadowRoot = shadowRoot;
  accounts = [];
  displayAccounts(accounts, shadowRoot);

  shadowRoot.dispatchEvent(new CustomEvent("ThinToken_GetAccList", {
    bubbles: true,
    composed: true,
  }));

  shadowRoot.addEventListener("ThinToken_RenderAccountList", (ev) => {
    console.log("Re-render event");
    accounts = [];
    shadowRoot.dispatchEvent(new CustomEvent("ThinToken_GetAccList", {
      bubbles: true,
      composed: true,
    }));
  });
}

function rawStringToAccObj(raw) {
  let accountEmail = raw.split(",")[0].split("-")[0];
  let accountName;

  let hostname = raw.split(",")[0].split("-")[1];
  if (hostname) {
    matchers.forEach(m => {
      let regex = new RegExp(m.find);
      console.log("Search:", hostname.search(regex));
      if (hostname.search(regex) !== -1) {
        accountName = m.name;
        // console.log("accountName:", accountName);
      }
    });
  } else {
    matchers.forEach(m => {
      let regex = new RegExp(m.find);
      console.log("Search:", accountEmail.search(regex));
      if (accountEmail.search(regex) !== -1) {
        accountName = m.name;
        // console.log("accountName:", accountName);
      }
    });
    hostname = "";
  }

  return {
    accountEmail: accountEmail,
    accountName: accountName,
    hostname: hostname
  }
}

function appendAccount(raw) {
  if (accounts.length > 4) {
    return;
  }
  let accObj = rawStringToAccObj(raw);
  accounts.push(accObj);

  displayAccounts(accounts, global_accountList_shadowRoot);
}

function removeAccountFromList(label) {
  console.log("Remove from list");
  console.log(accounts);
  const idx = accounts.findIndex((a) => a.accountEmail === label);
  if (idx > -1) {
    accounts.splice(idx, 1);
  }
  console.log(accounts);
  displayAccounts(accounts, global_accountList_shadowRoot);
}