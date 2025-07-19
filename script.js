/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Track selected products */
const selectedProducts = [];

/* Toggle product selection */
function toggleProductSelection(product, cardElement) {
  const productIndex = selectedProducts.findIndex(
    (selected) => selected.name === product.name
  );

  if (productIndex > -1) {
    // Product is already selected, remove it
    selectedProducts.splice(productIndex, 1);
    cardElement.classList.remove("selected");
  } else {
    // Product is not selected, add it
    selectedProducts.push(product);
    cardElement.classList.add("selected");
  }

  updateSelectedProductsList();
}

/* Update the selected products list in the UI */
function updateSelectedProductsList() {
  const selectedProductsList = document.getElementById("selectedProductsList");
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product, index) => `
        <div class="selected-product">
          <p>${product.name} <button class="remove-btn" data-index="${index}">✖</button></p>
        </div>
      `
    )
    .join("");

  // Add click event listeners to remove buttons
  const removeButtons = document.querySelectorAll(".remove-btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const productIndex = parseInt(e.target.dataset.index, 10);
      removeProductFromList(productIndex);
    });
  });
}

/* Remove a product from the selected list */
function removeProductFromList(index) {
  const removedProduct = selectedProducts.splice(index, 1)[0];

  // Find the corresponding product card and remove the 'selected' class
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    if (card.dataset.name === removedProduct.name) {
      card.classList.remove("selected");
    }
  });

  updateSelectedProductsList();
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
        <div class="product-card" data-name="${product.name}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
          </div>
        </div>
      `
    )
    .join("");

  // Add click event listeners to product cards
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card, index) => {
    card.addEventListener("click", () =>
      toggleProductSelection(products[index], card)
    );
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
