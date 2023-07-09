class DB {
  constructor() {
    this.db = {};
  }
  insert(spender, consumer, amount) {
    if (spender > consumer) {
      const key = spender + '*' + consumer;
      if (key in this.db) {
        this.db[key] += amount;
      } else {
        this.db[key] = amount;
      }
    } else if (spender < consumer) {
      const key = consumer + '*' + spender;
      if (key in this.db) {
        this.db[key] -= amount;
      } else {
        this.db[key] = 0 - amount;
      }
    }
  }
  getSummary() {
    const summary = [];
    for (const i in this.db) {
      if (this.db[i] !== 0) {
        if (this.db[i] < 0) {
          const [spender, consumer] = i.split('*');
          const amount = this.db[i] * -1;
          summary.push(`${spender} pays ${consumer} Rs ${amount}`);
        } else {
          const [consumer, spender] = i.split('*');
          const amount = this.db[i];
          summary.push(`${spender} pays ${consumer} Rs ${amount}`);
        }
      }
    }
    return summary;
  }
}


class Transaction {
  static db = new DB();
  constructor(expense, totalAmount, spender, consumers, customSplit = []) {
    this.spender = spender;
    this.consumers = consumers;
    this.totalAmount = totalAmount;
    this.expense = expense;
    this.customSplit = customSplit;
    if (customSplit.length === 0) {
      for (const consumer of consumers) {
        Transaction.db.insert(spender, consumer, totalAmount / (consumers.length + 1));
      }
    } else {
      for (let i = 0; i < consumers.length; i++) {
        const consumer = consumers[i];
        const amount = customSplit[i];
        Transaction.db.insert(spender, consumer, amount);
      }
    }
  }
  getDB() {
    return Transaction.db;
  }
  getSummary() {
    return Transaction.db.getSummary();
  }
}


var transactions = []
displayTransactions(transactions);


// Create a new Transaction and display the summary
function createTransaction(event) {
  const expense = document.getElementById('expense').value;
  const totalAmount = parseFloat(document.getElementById('totalAmount').value);
  const spender = document.getElementById('spender').value;
  const consumers = document.getElementById('consumers').value.split(',');
  var customSplit = document.getElementById('customSplit').value.split(',').map(i=>Number(i));
  if (!validateInput(expense, totalAmount, spender, consumers)) {
    return;
  }
  if(customSplit.length === 1 && customSplit[0] === 0){
    customSplit = [];
  }
  console.log(expense,totalAmount, spender, consumers, customSplit);
  var transaction = new Transaction(expense, totalAmount, spender, consumers, customSplit);
  transactions.push(transaction);
  displayTransactions(transactions);
  document.getElementById("transaction-form").reset();
}


// Display the transactions in the HTML table
function displayTransactions(transactions) {
  const transactionsBody = document.getElementById('transactions-body');
  transactionsBody.innerHTML = '';
  transactions.forEach((transaction) => {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${transaction.expense}</td>
    <td>${transaction.totalAmount}</td>
    <td>${transaction.spender}</td>
    <td>${transaction.consumers.join(', ')}</td>
  `;
  transactionsBody.appendChild(row);
});
}


// Display the summary in the HTML
function displaySummary(summary) {
  const summaryList = document.getElementById('summary-list');
  summaryList.innerHTML = '';

  summary.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    summaryList.appendChild(li);
  });
  console.log(transactions[0].getSummary())
}
