function drawProductList(products) {
    const productList = document.getElementById("accountlisting");
    const productsPerRow = 3; // Pwede niyo to palitan kung gusto niyo more products per row

    productList.replaceChildren([]);
    if (!products.length) return;

    let rows = [];
    for (let i = 0; i < products.length / productsPerRow; i++) {
        rows.push(
            createElement("div", ["row"])
        );
    }

    for (let i = 0; i < products.length; i++) {
        let currRow = Math.floor(i / productsPerRow);
        let test = drawOneProduct(products[i]);
        rows[currRow].appendChild(test);
    }

    let kulang = productsPerRow - rows[rows.length - 1].children.length;
    if (kulang > 0) {
        for (let i = 0; i < kulang; i++) {
            rows[rows.length - 1].appendChild(createElement("div", ["col", "mx-1"]));
        }
    }

    rows.forEach(row => productList.appendChild(row));
}

function drawOneProduct(details) {
    let column = createElement("div", ["col", "mx-1"]);
    let link = createElement("a");
    link.setAttribute("href", details.productPage);
    let container = createElement("div", ["product-landing-container"]);

    let imgContainer = createElement("div", ["img-container"]);
    let productImg = createElement("img");
    productImg.setAttribute("src", details.img);
    imgContainer.appendChild(
        productImg
    );

    let productName = createElement("div", ["name"], "green-text");
    productName.textContent = details.name;
    let productDesc = createElement("div", ["description"]);
    productDesc.textContent = details.description;
    let productPrice = createElement("div", ["price"], "green-text");
    productPrice.textContent = `₱ ${details.price.toFixed(2)}`;
    let starsContainer = drawStars(details.n_stars, details.n_reviews);

    container.appendChild(imgContainer);
    container.appendChild(productName);
    container.appendChild(productDesc);
    container.appendChild(productPrice);
    container.appendChild(starsContainer);
    link.appendChild(container);
    column.appendChild(link);

    return column;
}

const products = [
    {
        accountName: "biogesic",
        accountEmail: "Biogesic",
        
    },
    ]