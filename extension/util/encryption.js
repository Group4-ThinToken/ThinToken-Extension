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
  );

  console.log(rawKey);

  return rawKey;
}
