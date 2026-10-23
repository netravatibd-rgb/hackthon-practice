# Our Hackathon Team

- Member 1: Frontend
- Member 2: Backend
- Member 3: Database
- Member 4: Testing and Integration

Frontend

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LocalLoop Marketplace</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f6f8f3;
      color: #203b30;
    }
    header {
      background: #176b50;
      color: white;
      padding: 20px;
      text-align: center;
    }
    nav {
      display: flex;
      justify-content: center;
      gap: 15px;
      flex-wrap: wrap;
      padding: 15px;
      background: white;
    }
    nav a {
      text-decoration: none;
      color: #176b50;
      font-weight: bold;
    }
    .hero {
      padding: 35px 20px;
      text-align: center;
      background: #e5f2e6;
    }
    .hero h1 { font-size: 36px; }
    input, select, button {
      padding: 11px;
      margin: 5px;
      border-radius: 7px;
      border: 1px solid #ccd8ce;
    }
    button {
      background: #176b50;
      color: white;
      cursor: pointer;
      border: none;
    }
    .container {
      max-width: 1100px;
      margin: auto;
      padding: 20px;
    }
    .products {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 18px;
    }
    .card {
      background: white;
      padding: 18px;
      border-radius: 14px;
      box-shadow: 0 3px 12px #00000010;
    }
    .emoji {
      font-size: 55px;
      text-align: center;
      background: #edf5ed;
      padding: 20px;
      border-radius: 10px;
    }
    .price {
      font-size: 20px;
      font-weight: bold;
    }
    .panel {
      background: white;
      padding: 20px;
      border-radius: 14px;
      margin-top: 25px;
    }
    .panel input, .panel select {
      max-width: 180px;
      width: 90%;
    }
    footer {
      margin-top: 30px;
      padding: 20px;
      text-align: center;
      background: #176b50;
      color: white;
    }
  </style>
</head>
<body>

<header>
  <h1>🛍️ LocalLoop</h1>
  <p>Your neighbourhood, one marketplace</p>
</header>

<nav>
  <a href="#home">Home</a>
  <a href="#shop">Shop Products</a>
  <a href="#seller">Seller Dashboard</a>
  <a href="#cart">Cart (<span id="count">0</span>)</a>
</nav>

<section class="hero" id="home">
  <h1>Discover Local. Shop Better.</h1>
  <p>Support small businesses and discover products near you.</p>
  <input id="search" placeholder="Search products or shops..."
         oninput="displayProducts()">
  <button onclick="displayProducts()">Search</button>
</section>

<main class="container">
  <section id="shop">
    <h2>Explore Products</h2>
    <label for="category">Category:</label>
    <select id="category" onchange="displayProducts()">
      <option value="All">All Products</option>
      <option value="Food">Food</option>
      <option value="Handmade">Handmade</option>
      <option value="Fashion">Fashion</option>
      <option value="Home">Home</option>
      <option value="Plants">Plants</option>
    </select>

    <div class="products" id="productList"></div>
  </section>

  <section class="panel" id="cart">
    <h2>🛒 Shopping Cart</h2>
    <div id="cartList">Your cart is empty.</div>
    <h3>Total: ₹<span id="total">0</span></h3>
    <button onclick="checkout()">Place Demo Order</button>
    <p>Demo checkout only; no real payment is processed.</p>
  </section>

  <section class="panel" id="seller">
    <h2>🏪 Seller Dashboard</h2>
    <p>Add a new product to your local marketplace.</p>
    <form id="addForm">
      <input id="name" placeholder="Product name" required>
      <input id="shopName" placeholder="Shop name" required>
      <select id="newCategory">
        <option>Food</option>
        <option>Handmade</option>
        <option>Fashion</option>
        <option>Home</option>
        <option>Plants</option>
      </select>
      <input id="price" type="number" min="1"
             placeholder="Price ₹" required>
      <input id="stock" type="number" min="0"
             placeholder="Quantity" required>
      <button type="submit">Add Product</button>
    </form>
  </section>

  <section class="panel">
    <h2>📊 Inventory and Sales</h2>
    <p>Products listed: <strong id="productCount">0</strong></p>
    <p>Demo orders completed: <strong id="orders">0</strong></p>
    <p>Sales total: <strong>₹<span id="sales">0</span></strong></p>
    <p>Low-stock products: <strong id="lowStock">0</strong></p>
    <div id="inventory"></div>
  </section>

  <section class="panel">
    <h2>💡 Recommended for You</h2>
    <p id="recommendation">
      Explore local food, handmade gifts, and plants.
    </p>
  </section>
</main>

<footer>
  <p>LocalLoop — Supporting Local Businesses 💚</p>
  <p>Student Hackathon Project | HTML, CSS and JavaScript</p>
</footer>

<script>
  let products = [
    {id:1, name:"Fresh Vegetables", shop:"Green Basket",
     category:"Food", price:120, stock:15, emoji:"🥬"},
    {id:2, name:"Handmade Mug", shop:"Mitti Studio",
     category:"Handmade", price:250, stock:4, emoji:"🏺"},
    {id:3, name:"Cotton Tote Bag", shop:"Thread Local",
     category:"Fashion", price:200, stock:10, emoji:"👜"},
    {id:4, name:"Indoor Plant", shop:"Leafy Lane",
     category:"Plants", price:150, stock:3, emoji:"🪴"},
    {id:5, name:"Decorative Lamp", shop:"Home Craft",
     category:"Home", price:450, stock:7, emoji:"💡"}
  ];

  let cart = {};
  let orders = 0;
  let sales = 0;
  let nextId = 6;

  function displayProducts() {
    const query = document.getElementById("search")
      .value.toLowerCase();
    const category = document.getElementById("category").value;

    const filtered = products.filter(p =>
      (category === "All" || p.category === category) &&
      (p.name.toLowerCase().includes(query) ||
       p.shop.toLowerCase().includes(query) ||
       p.category.toLowerCase().includes(query))
    );

    const list = document.getElementById("productList");
    list.innerHTML = "";

    if (!filtered.length) {
      list.textContent = "No matching products found.";
    }

    filtered.forEach(p => {
      const card = document.createElement("article");
      card.className = "card";

      const emoji = document.createElement("div");
      emoji.className = "emoji";
      emoji.textContent = p.emoji;

      const title = document.createElement("h3");
      title.textContent = p.name;

      const shop = document.createElement("p");
      shop.textContent = "Shop: " + p.shop;

      const price = document.createElement("p");
      price.className = "price";
      price.textContent = "₹" + p.price;

      const stock = document.createElement("p");
      stock.textContent = p.stock <= 5
        ? "⚠️ Low stock: " + p.stock
        : "In stock: " + p.stock;

      const button = document.createElement("button");
      button.textContent = "Add to Cart";
      button.disabled = p.stock === 0;
      button.onclick = () => addToCart(p.id);

      card.append(emoji, title, shop, price, stock, button);
      list.appendChild(card);
    });

    updateDashboard();
  }

  function addToCart(id) {
    const product = products.find(p => p.id === id);
    const quantity = cart[id] || 0;

    if (quantity >= product.stock) {
      alert("Not enough stock available.");
      return;
    }

    cart[id] = quantity + 1;
    displayCart();
  }

  function displayCart() {
    const list = document.getElementById("cartList");
    list.innerHTML = "";
    let total = 0;
    let count = 0;

    Object.keys(cart).forEach(id => {
      const p = products.find(item => item.id === Number(id));
      const quantity = cart[id];
      total += p.price * quantity;
      count += quantity;

      const row = document.createElement("p");
      row.textContent =
        p.name + " × " + quantity + " — ₹" +
        (p.price * quantity) + " ";

      const remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.onclick = () => {
        delete cart[id];
        displayCart();
      };

      row.appendChild(remove);
      list.appendChild(row);
    });

    if (count === 0) list.textContent = "Your cart is empty.";

    document.getElementById("total").textContent = total;
    document.getElementById("count").textContent = count;

    document.getElementById("recommendation").textContent =
      count > 0
        ? "Thanks for shopping locally! Explore more products from nearby shops."
        : "Explore local food, handmade gifts, and plants.";

    return total;
  }

  function checkout() {
    const ids = Object.keys(cart);
    if (!ids.length) {
      alert("Please add products to your cart first.");
      return;
    }

    for (const id of ids) {
      const p = products.find(item => item.id === Number(id));
      if (cart[id] > p.stock) {
        alert("Stock changed. Please review your cart.");
        return;
      }
    }

    const amount = displayCart();

    ids.forEach(id => {
      const p = products.find(item => item.id === Number(id));
      p.stock -= cart[id];
    });

    sales += amount;
    orders++;
    cart = {};

    displayCart();
    displayProducts();
    updateDashboard();
    alert("Demo order placed successfully!");
  }

  document.getElementById("addForm").addEventListener(
    "submit", function(event) {
      event.preventDefault();

      const name = document.getElementById("name").value.trim();
      const shop = document.getElementById("shopName").value.trim();
      const category = document.getElementById("newCategory").value;
      const price = Number(document.getElementById("price").value);
      const stock = Number(document.getElementById("stock").value);

      if (!name || !shop || price <= 0 ||
          !Number.isInteger(stock) || stock < 0) {
        alert("Please enter valid product details.");
        return;
      }

      const emojis = {
        Food:"🥗", Handmade:"🎨", Fashion:"👕",
        Home:"🏡", Plants:"🪴"
      };

      products.push({
        id: nextId++, name, shop, category, price, stock,
        emoji: emojis[category]
      });

      this.reset();
      displayProducts();
      updateDashboard();
      alert("Product added successfully!");
    }
  );

  function updateDashboard() {
    document.getElementById("productCount").textContent =
      products.length;
    document.getElementById("orders").textContent = orders;
    document.getElementById("sales").textContent = sales;
    document.getElementById("lowStock").textContent =
      products.filter(p => p.stock <= 5).length;

    document.getElementById("inventory").innerHTML =
      "<h3>Stock Report</h3>" +
      products.map(p =>
        "<p>" + p.name + " — " + p.stock + " available" +
        (p.stock <= 5 ? " ⚠️ Restock needed" : "") +
        "</p>"
      ).join("");
  }

  displayProducts();
  displayCart();
  updateDashboard();
</script>

</body>
</html>
