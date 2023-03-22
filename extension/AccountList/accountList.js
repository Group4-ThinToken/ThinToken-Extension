function getIconClass(accountName) {
  const iconClasses = {
    Facebook: "fab fa-facebook",
    Google: "fab fa-google",
    Twitter: "fab fa-twitter",
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
  accounts.forEach(account => {
    const accountCard = createAccountCard(account, shadowRoot);
    accountListing.appendChild(accountCard);
  });
}

const accounts = [
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
  displayAccounts(accounts, shadowRoot);
}