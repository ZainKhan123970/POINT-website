/*
  POINT ADMIN PANEL
  1) Replace SUPABASE_URL and SUPABASE_ANON_KEY below.
  2) In Supabase Auth, create the client's admin user.
  3) This panel expects a public "products" table with:
     id, name, price, description, image_url, category, sizes, stock, featured, created_at
*/

const SUPABASE_URL = "https://pudjdblduksbttlwhvyz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Iv_8FrGP_XZ96QjRo5tzcw_-udsNuzL";

const isConfigured =
  !SUPABASE_URL.startsWith("YOUR_") &&
  !SUPABASE_ANON_KEY.startsWith("YOUR_");

const sb = isConfigured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const $ = (id) => document.getElementById(id);

async function requireSession() {
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    if (!location.pathname.endsWith("/login.html")) {
      location.href = "login.html";
    }
    return null;
  }
  if ($("adminEmail")) $("adminEmail").textContent = session.user.email || "";
  return session;
}

async function initLogin() {
  if (!$("loginForm")) return;

  if (!sb) {
    $("loginMessage").textContent = "Add your Supabase URL and anon key in admin.js first.";
    return;
  }

  const { data: { session } } = await sb.auth.getSession();
  if (session) location.href = "dashboard.html";

  $("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("loginMessage").textContent = "Signing in…";

    const { error } = await sb.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });

    if (error) {
      $("loginMessage").textContent = error.message;
      return;
    }
    location.href = "dashboard.html";
  });
}

let allProducts = [];

async function loadProducts() {
  if (!sb) {
    $("productsList").innerHTML = '<div class="empty-state">Configure Supabase in admin.js first.</div>';
    return;
  }

  const { data, error } = await sb
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    $("productsList").innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return;
  }

  allProducts = data || [];
  renderProducts(allProducts);
  updateStats(allProducts);
}

function updateStats(products) {
  $("totalProducts").textContent = products.length;
  $("inStock").textContent = products.filter(p => Number(p.stock) > 0).length;
  $("featuredProducts").textContent = products.filter(p => p.featured === true).length;
}

function renderProducts(products) {
  if (!products.length) {
    $("productsList").innerHTML = '<div class="empty-state">No products yet. Add the first product.</div>';
    return;
  }

  $("productsList").innerHTML = products.map(p => `
    <article class="product-row">
      <img class="product-thumb" src="${escapeAttr(p.image_url || "")}" alt="">
      <div>
        <div class="product-name">${escapeHtml(p.name || "Untitled")}</div>
        <div class="product-meta">${escapeHtml(p.category || "Uncategorised")}</div>
      </div>
      <div class="price">Rs. ${Number(p.price || 0).toLocaleString()}</div>
      <div class="stock">${Number(p.stock || 0)} in stock</div>
      <div class="featured">${p.featured ? "FEATURED" : ""}</div>
      <div class="row-actions">
        <button data-edit="${p.id}">Edit</button>
        <button class="delete" data-delete="${p.id}">Delete</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-edit]").forEach(btn =>
    btn.addEventListener("click", () => openEdit(Number(btn.dataset.edit)))
  );
  document.querySelectorAll("[data-delete]").forEach(btn =>
    btn.addEventListener("click", () => deleteProduct(Number(btn.dataset.delete)))
  );
}

function openNew() {
  $("productForm").reset();
  $("productId").value = "";
  $("modalEyebrow").textContent = "NEW PRODUCT";
  $("modalTitle").textContent = "Add product";
  $("productModal").hidden = false;
}

function openEdit(id) {
  const p = allProducts.find(item => Number(item.id) === id);
  if (!p) return;

  $("productId").value = p.id;
  $("productName").value = p.name || "";
  $("productPrice").value = p.price ?? "";
  $("productStock").value = p.stock ?? 0;
  $("productCategory").value = p.category || "";
  $("productSizes").value = Array.isArray(p.sizes) ? p.sizes.join(", ") : "";
  $("productImage").value = p.image_url || "";
  $("productDescription").value = p.description || "";
  $("productFeatured").checked = !!p.featured;
  $("modalEyebrow").textContent = "EDIT PRODUCT";
  $("modalTitle").textContent = "Edit product";
  $("formMessage").textContent = "";
  $("productModal").hidden = false;
}

async function saveProduct(event) {
  event.preventDefault();
  if (!sb) return;

  $("formMessage").textContent = "Saving…";

  const id = $("productId").value;
  const payload = {
    name: $("productName").value.trim(),
    price: Number($("productPrice").value),
    description: $("productDescription").value.trim(),
    image_url: $("productImage").value.trim(),
    category: $("productCategory").value.trim(),
    sizes: $("productSizes").value
      .split(",")
      .map(s => s.trim())
      .filter(Boolean),
    stock: Number($("productStock").value),
    featured: $("productFeatured").checked
  };

  const query = id
    ? sb.from("products").update(payload).eq("id", id)
    : sb.from("products").insert(payload);

  const { error } = await query;

  if (error) {
    $("formMessage").textContent = error.message;
    return;
  }

  $("productModal").hidden = true;
  await loadProducts();
}

async function deleteProduct(id) {
  if (!confirm("Delete this product? This cannot be undone.")) return;

  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await loadProducts();
}

function setupDashboard() {
  if (!$("productsList")) return;

  requireSession().then(session => {
    if (!session && sb) return;
    loadProducts();
  });

  $("newProductBtn").addEventListener("click", openNew);
  $("closeModal").addEventListener("click", () => $("productModal").hidden = true);
  $("cancelBtn").addEventListener("click", () => $("productModal").hidden = true);
  $("productForm").addEventListener("submit", saveProduct);

  $("searchInput").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    renderProducts(allProducts.filter(p =>
      [p.name, p.category, p.description].some(v => String(v || "").toLowerCase().includes(q))
    ));
  });

  $("logoutBtn").addEventListener("click", async () => {
    if (sb) await sb.auth.signOut();
    location.href = "login.html";
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
function escapeAttr(value) {
  return escapeHtml(value);
}

initLogin();
setupDashboard();
