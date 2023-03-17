function createAccountCard(account) {
    let accountCard = document.createElement("div");
    accountCard.classList.add("accountCard");

    let icon = document.createElement("img");
    icon.src = account.icon;
    icon.classList.add("accountIcon");
    accountCard.appendChild(icon);

    let accountName = document.createElement("div");
    accountName.textContent = account.accountName;
    accountName.classList.add("accountName");
    accountCard.appendChild(accountName);

    let accountEmail = document.createElement("div");
    accountEmail.textContent = account.accountEmail;
    accountEmail.classList.add("accountEmail");
    accountCard.appendChild(accountEmail);

    let accountType = document.createElement("div");
    accountType.textContent = "2FA";
    accountType.classList.add("accountType");
    accountCard.appendChild(accountType);

    return accountCard;
}

function displayAccounts(accounts) {
    const accountList = document.getElementById("accountlisting");

    for (let account of accounts) {
        let accountCard = createAccountCard(account);
        accountList.appendChild(accountCard);
    }
}

const accounts = [
    {
        accountName: "Facebook",
        accountEmail: "example@facebook.com",
        icon: "https://path/to/facebook/icon.png"
    },
    {
        accountName: "Google",
        accountEmail: "example@google.com",
        icon: "https://path/to/google/icon.png"
    },
    {
        accountName: "Twitter",
        accountEmail: "example@twitter.com",
        icon: "https://path/to/twitter/icon.png"
    },
];

displayAccounts(accounts);
