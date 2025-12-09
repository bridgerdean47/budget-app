// Simple Budget App (Frontend Only)

// We will store transactions in an array.
// Each transaction looks like:
// { id: 1, type: "income" or "expense", description: "Job", amount: 1000 }

let transactions = [];

// Try to load existing data from localStorage when the page loads
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("transactions");
  if (saved) {
    transactions = JSON.parse(saved);
  }
  render();
});

// Get references to DOM elements
const form = document.getElementById("transaction-form");
const typeSelect = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");

const totalIncomeEl = document.getElementById("total-income");
const totalExpensesEl = document.getElementById("total-expenses");
const balanceEl = document.getElementById("balance");
const transactionListEl = document.getElementById("transaction-list");

// Handle form submit
form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop page refresh

  const type = typeSelect.value;
  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!description || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid description and amount.");
    return;
  }

  const newTransaction = {
    id: Date.now(), // simple unique id
    type,
    description,
    amount
  };

  transactions.push(newTransaction);

  // Clear inputs
  descriptionInput.value = "";
  amountInput.value = "";

  saveAndRender();
});

// Save to localStorage
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Render everything: summary + transaction table
function render() {
  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Update summary text
  totalIncomeEl.textContent = `$${totalIncome.toFixed(2)}`;
  totalExpensesEl.textContent = `$${totalExpenses.toFixed(2)}`;
  balanceEl.textContent = `$${balance.toFixed(2)}`;

  // Clear existing rows
  transactionListEl.innerHTML = "";

  // Add a row for each transaction
  transactions.forEach((t) => {
    const tr = document.createElement("tr");

    const typeTd = document.createElement("td");
    typeTd.textContent = t.type === "income" ? "Income" : "Expense";
    typeTd.className =
      t.type === "income" ? "transaction-income" : "transaction-expense";

    const descTd = document.createElement("td");
    descTd.textContent = t.description;

    const amountTd = document.createElement("td");
    amountTd.textContent = `$${t.amount.toFixed(2)}`;

    const deleteTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => {
      deleteTransaction(t.id);
    });
    deleteTd.appendChild(deleteBtn);

    tr.appendChild(typeTd);
    tr.appendChild(descTd);
    tr.appendChild(amountTd);
    tr.appendChild(deleteTd);

    transactionListEl.appendChild(tr);
  });
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveAndRender();
}

function saveAndRender() {
  saveTransactions();
  render();
}
