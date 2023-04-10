function onAddFormLoaded(shadowRoot) {
  const secretField = shadowRoot.querySelector("#secret");
  const accountField = shadowRoot.querySelector("#accountName");
  const addBtn = shadowRoot.querySelector("#addBtn");

  console.log("Add form loaded");

  addBtn.addEventListener("click", () => {
    console.log(accountField.value);
    console.log(secretField.value);

    // Rethrow event then listen on mainFlow.js
    shadowRoot.dispatchEvent(new CustomEvent("ThinToken_FormDone", {
      bubbles: true,
      composed: true,
      detail: {
        label: accountField.value,
        secret: secretField.value
      }
    }));
  });
}
