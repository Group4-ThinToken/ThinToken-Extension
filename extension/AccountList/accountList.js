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

function createAccountCard(account) {
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
}

function rawStringToAccObj(raw) {
  let accountEmail = raw.split(",")[0];
  let accountName;

  matchers.forEach(m => {
    let regex = new RegExp(m.find);
    if (accountEmail.search(regex) !== "") {
      accountName = m.name;
    }
  });

  return {
    accountEmail: accountEmail,
    accountName: accountName
  }
}

function appendAccount(raw) {
  let accObj = rawStringToAccObj(raw);
  accounts.push(accObj);

  displayAccounts(accounts, global_accountList_shadowRoot);
}