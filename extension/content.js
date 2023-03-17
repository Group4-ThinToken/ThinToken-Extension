// alert("Hello world from content.js");
console.log("Hello world from content.js")


// let totpField = document.querySelector("#totpPin");
// console.log(totpField);

// totpField.value = "123456";

// let nextButton = document.querySelector("#totpNext");

// nextButton.click();

async function requestBluetoothDevice() {

}

async function generateAes256Key() {
    console.log("Generating AES key")
    let key = await window.crypto.subtle.generateKey({
        name: "AES-GCM",
        length: 256
    },
    true,
    ['encrypt', 'decrypt']);

    console.log(key);

    let rawKey = await window.crypto.subtle.exportKey(
        "raw",
        key
    )

    console.log(rawKey);

    return rawKey;
}

generateAes256Key();