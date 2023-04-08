runTests();

//#region Enabled tests
async function runTests() {
  let enc = await test_generateKeyEncryptAndStoreId();
  await test_otpValueChangeHandler(enc);
}
//#endregion

//#region Test cases
async function test_generateKeyEncryptAndStoreId() {
  console.log("test_generateKeyEncryptAndStoreId");
  // Data
  let val = "cruz.james99@gmail.com GMAIL,TESTSECRETASSD";
  let idRaw = [199, 76, 192, 25];
  let id = new Uint16Array(idRaw)[0];

  let rawKey = await generateAes256Key();
  console.log("Raw key:");
  console.log(rawKey);
  let key = await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
  let iv = window.crypto.getRandomValues(new Uint8Array(12));

  let btMsg = new TextEncoder().encode(val);
  let encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    btMsg
  );

  secretsObj = {
    key: new Uint8Array(rawKey),
    iv: iv,
    id: id
  };

  localStorage.setItem(secretsObj.id,
    JSON.stringify(secretsObj));

  console.log("Secrets stored to local storage");
  console.log("Encrypted data:");
  console.log(encrypted);
  console.log("END test_generateKeyEncryptAndStoreId");
  return encrypted;
}

async function test_otpValueChangeHandler(encryptedData) {
  console.log("test_otpValueChangeHandler");
  // Data
  let val = encryptedData;
  let idFromBt = new Uint16Array([199, 76, 192, 25])[0];

  // Decrypt val
  let iv = Object.values(JSON.parse(localStorage.getItem(idFromBt)).iv);
  iv = new Uint8Array(iv);
  console.log("IV:")
  console.log(iv);
  let rawKey = Object.values(JSON.parse(localStorage.getItem(idFromBt)).key);
  console.log("Raw key:")
  console.log(rawKey);
  rawKey = new Uint8Array(rawKey);
  console.log("Raw key:")
  console.log(rawKey);
  let key = await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    true,
    ['encrypt', 'decrypt']
  );
  console.log("Crypto key:")
  console.log(key);

  let decrypted;
  try {
    decrypted = await window.crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: iv
      },
      key,
      val
    );
  } catch (error) {
    console.error(error);
  }
  decrypted = new TextDecoder().decode(decrypted);

  console.log("Decrypted:");
  console.log(decrypted);

  console.log("END test_otpValueChangeHandler");
}
//#endregion