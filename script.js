const loginBox = document.getElementById("loginBox");
const passwordInput = document.getElementById("password");
const app = document.getElementById("app");

const inventoryBody = document.querySelector("#inventoryTable tbody");
const purchaseLog = document.getElementById("purchaseLog");
const totalSaleDisplay = document.getElementById("totalSale");

const newItemName = document.getElementById("newItemName");
const newItemQty = document.getElementById("newItemQty");

/* =========================
   🔐 PASSWORD
========================= */
const PASSWORD = "snack_attack";

/* =========================
   🔥 FIREBASE CONFIG (YOURS)
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyBBpTceIiJeQCqh8NGK9L8dAOCow2i2Ii4",
  authDomain: "snack-inventory-a96f4.firebaseapp.com",
  projectId: "snack-inventory-a96f4",
  storageBucket: "snack-inventory-a96f4.appspot.com",
  messagingSenderId: "786616769718",
  appId: "1:786616769718:web:dfd3d42f167773b1e0da17"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const docRef = db.collection("inventory").doc("main");

/* =========================
   📦 DEFAULT DATA
========================= */
const DEFAULT_ITEMS = [
  {name:"Tedhe Medhe", qty:21},
  {name:"Mad Angles", qty:3},
  {name:"Kurkure Puffcorn", qty:5}
];

let items = [];
let logs = [];
let totalSale = 0;
let history = [];

/* =========================
   🔐 LOGIN
========================= */
function login(){
  if(passwordInput.value === PASSWORD){
    loginBox.style.display="none";
    app.classList.remove("hidden");
    loadData();
  } else {
    alert("Wrong password");
  }
}

/* =========================
   ☁️ LOAD FROM FIREBASE
========================= */
async function loadData() {
  const snap = await docRef.get();
  if (snap.exists) {
    const d = snap.data();
    items = d.items || DEFAULT_ITEMS;
    logs = d.logs || [];
    logs = logs.map(log => {
      if (typeof log === "string") {
        const match = log.match(/(.*?) bought (\d+) × (.*?) for ₹(\d+)/);

        if (match) {
          return {
            buyer: match[1],
            qty: parseInt(match[2]),
            item: match[3],
            amount: parseFloat(match[4]),
            date: new Date().toISOString()
          };
        }

        return null;
      }

      return log;
    }).filter(Boolean);

    totalSale = d.totalSale || 0;
    history = d.history || [];
  } else {
    items = DEFAULT_ITEMS;
    save();
  }
  renderAll();
}

/* =========================
   ☁️ SAVE TO FIREBASE
========================= */
function save() {
  docRef.set({ items, logs, totalSale, history });
}

/* =========================
   ↩️ SNAPSHOT (UNDO)
========================= */
function snapshot() {
  history.push(JSON.parse(JSON.stringify({ items, logs, totalSale })));
}

/* =========================
   🧾 RENDER UI
========================= */
function renderAll() {
  const rows = items.map((i, idx) => `
    <tr>
      <td>${i.name}</td>
      <td class="qty-cell">
      <button onclick="changeQty(${idx}, -1)">−</button>
      ${i.qty}
      <button onclick="changeQty(${idx}, 1)">+</button>
      </td>
      <td><input id="q${idx}" type="number"></td>
      <td><input id="b${idx}"></td>
      <td><input id="a${idx}" type="number"></td>
      <td><button class="delete-btn" onclick="deleteItem(${idx})">Delete</button></td>
    </tr>
  `).join("");

  inventoryBody.innerHTML = rows;

  totalSaleDisplay.textContent = totalSale;
  renderLogs();
}


function changeQty(index, amount) {
  snapshot();

  items[index].qty += amount;

  // prevent negative quantity
  if (items[index].qty < 0) {
    items[index].qty = 0;
  }

  save();
  renderAll();
}

function renderLogs(list = logs) {
  purchaseLog.innerHTML = "";

  let dayTotal = 0;

  list.forEach(l => {
    dayTotal += l.amount;

    purchaseLog.innerHTML += `
      <li>
        ${l.buyer} bought ${l.qty} × ${l.item}
        for ₹${l.amount}
      </li>
    `;
  });

  purchaseLog.innerHTML += `
    <li><strong>Total: ₹${dayTotal}</strong></li>
  `;
}


/* =========================
   💰 SELL ITEMS
========================= */
function sellAll() {
  snapshot();
  items.forEach((i, idx) => {
    let q = parseInt(document.getElementById(`q${idx}`).value);
    let b = document.getElementById(`b${idx}`).value;
    let a = parseFloat(document.getElementById(`a${idx}`).value);
    if (q > 0 && q <= i.qty && b && a > 0) {
      i.qty -= q;
      totalSale += a;
      logs.push({
        buyer: b,
        qty: q,
        item: i.name,
        amount: a,
        date: new Date().toISOString()
      });
    }
  });
  save(); renderAll();
}

/* =========================
   ↩️ UNDO (SALES ONLY)
========================= */
function undoLast() {
  if (!history.length) return alert("Nothing to undo");
  let last = history.pop();
  items = last.items;
  logs = last.logs;
  totalSale = last.totalSale;
  save(); renderAll();
}

/* =========================
   ➕ ADD / UPDATE ITEM
========================= */
function addOrUpdateItem() {
  snapshot();
  let name = newItemName.value.trim();
  let qty = parseInt(newItemQty.value);
  if (!name || qty <= 0) return alert("Enter valid data");

  let found = items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (found) found.qty += qty;
  else items.push({ name, qty });

  save(); renderAll();
  newItemName.value = "";
  newItemQty.value = "";
}

/* =========================
   ❌ DELETE ITEM
========================= */
function deleteItem(index) {
  if (!confirm("Delete this item?")) return;
  snapshot();
  items.splice(index, 1);
  save(); renderAll();
}

function filterByDate() {
  const selectedDate = document.getElementById("dateFilter").value;

  if (!selectedDate) return renderLogs();

  const filtered = logs.filter(log =>
    log.date && log.date.startsWith(selectedDate)
  );

  console.log(filtered);

  renderLogs(filtered);
}
