/* Get references to DOM elements */
const generateRoutineBtn = document.getElementById("generateRoutine");
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

/* Create a modal for displaying product details */
function createProductModal() {
  const modal = document.createElement("div");
  modal.id = "productModal";
  modal.className = "modal hidden";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">&times;</span>
      <div id="modalDetails"></div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal when clicking the close button
  modal.querySelector(".close-btn").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Close modal when clicking outside the modal content
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
}

/* Show product details in the modal */
function showProductDetails(product) {
  const modal = document.getElementById("productModal");
  const modalDetails = document.getElementById("modalDetails");
  modalDetails.innerHTML = `
    <h2>${product.name}</h2>
    <p>${product.description}</p>
    <img src="${product.image}" alt="${product.name}">
  `;
  modal.classList.remove("hidden");
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
            <button class="details-btn">Details</button>
          </div>
        </div>
      `
    )
    .join("");

  // Add click event listeners to product cards
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card, index) => {
    card.addEventListener("click", (event) => {
      // Prevent modal opening if 'Details' button is clicked
      if (event.target.classList.contains("details-btn")) {
        return;
      }

      const product = products[index];
      toggleProductSelection(product, card);
    });
  });

  // Add click event listeners to 'Details' buttons
  const detailsButtons = document.querySelectorAll(".details-btn");
  detailsButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent triggering the card's click event
      const productCard = button.closest(".product-card");
      const productName = productCard.dataset.name;
      console.log("Details button clicked for product:", productName); // Debug log
      const product = products.find((p) => p.name === productName);
      if (product) {
        console.log("Product found:", product); // Debug log
        showProductDetails(product);
      } else {
        console.error("Product not found for name:", productName); // Debug log
      }
    });
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

/* Maintain conversation history */
const conversationHistory = [
  {
    role: "system",
    content:
      "You are a skincare expert. Answer questions related to the generated routine or topics like skincare, haircare, makeup, and fragrance. Be concise and helpful.",
  },
];

/* Function to scroll chatbox to the bottom */
function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Chat form submission handler - process user questions */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = e.target.elements["userInput"].value.trim();
  if (!userInput) {
    chatWindow.innerHTML += "<p>Please enter a question or message.</p>";
    scrollToBottom();
    return;
  }

  // Add user message bubble
  chatWindow.innerHTML += `<div class="chat-user"><p><strong>You:</strong> ${userInput}</p></div>`;
  scrollToBottom();

  // Add user input to conversation history
  conversationHistory.push({ role: "user", content: userInput });

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0].message.content) {
      const reply = data.choices[0].message.content;

      // Format the reply for better readability
      const formattedReply = reply
        .split("\n\n")
        .map((paragraph) => `<p>${paragraph}</p>`)
        .join("");

      // Add chatbot message bubble
      chatWindow.innerHTML += `<div class="chat-reply"><p><strong>Expert:</strong>${formattedReply}</p></div>`;
      scrollToBottom();

      // Add chatbot reply to conversation history
      conversationHistory.push({ role: "assistant", content: reply });
    } else {
      chatWindow.innerHTML +=
        "<p>Failed to get a response. Please try again.</p>";
      scrollToBottom();
    }
  } catch (error) {
    console.error("Error processing question:", error);
    chatWindow.innerHTML += "<p>An error occurred. Please try again later.</p>";
    scrollToBottom();
  }

  e.target.reset();
});

/* Cloudflare Worker URL */
const WORKER_URL = "https://loreal-chatbot.jsdobnik.workers.dev/";

// Generate routine button click handler
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<div class="chat-reply"><p>Please select some products to generate a routine.</p></div>`;
    scrollToBottom();
    return;
  }

  // Show loading message
  const loadingMessage = document.createElement("div");
  loadingMessage.className = "chat-reply";
  loadingMessage.innerHTML = `<p>Your routine is being generated...</p>`;
  chatWindow.appendChild(loadingMessage);
  scrollToBottom();

  // Prepare data for OpenAI API
  const productsForAPI = selectedProducts.map(
    ({ name, brand, category, description }) => ({
      name,
      brand,
      category,
      description,
    })
  );

  const messages = [
    {
      role: "system",
      content:
        "You are a skincare expert. Generate a personalized skincare routine based on the provided products.",
    },
    {
      role: "user",
      content: `Here are the selected products: ${JSON.stringify(
        productsForAPI
      )}`,
    },
  ];

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 1000, // Adjust this value as needed
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Remove loading message
    chatWindow.removeChild(loadingMessage);

    if (data.choices && data.choices[0].message.content) {
      const routine = data.choices[0].message.content;

      // Format the routine for better readability
      const formattedRoutine = routine
        .split("\n\n")
        .map((step) => `<p>${step}</p>`)
        .join("");

      // Display the routine as plain content
      chatWindow.innerHTML += `<h2>Your Personalized Routine:</h2>${formattedRoutine}`;
      scrollToBottom();
    } else {
      chatWindow.innerHTML +=
        "<p>Failed to generate a routine. Please try again.</p>";
      scrollToBottom();
    }
  } catch (error) {
    console.error("Error generating routine:", error);
    chatWindow.innerHTML +=
      "<p>An error occurred while generating the routine. Please try again later.</p>";
    scrollToBottom();
  }
});

// Ensure the modal is created when the script initializes
createProductModal();
