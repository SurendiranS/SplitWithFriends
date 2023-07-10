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
          const amount = Math.round(((this.db[i] * -1) + Number.EPSILON) * 100) / 100;
          summary.push(`${spender} pays ${consumer} Rs ${amount}`);
        } else {
          const [consumer, spender] = i.split('*');
          const amount = Math.round((this.db[i] + Number.EPSILON) * 100) / 100;
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
    this.expense = expense;
    this.totalAmount = totalAmount;
    this.spender = spender;
    this.consumers = consumers;
    this.customSplit = customSplit;
    this.split = 0;
    if (customSplit.length === 0) {
      this.split = Math.round(( (totalAmount / (consumers.length)) + Number.EPSILON) * 100) / 100
      for (const consumer of consumers) {
        Transaction.db.insert(spender, consumer, this.split);
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
  const spender = document.getElementById('spender').value.trim();
  const consumers = document.getElementById('consumers').value.split(',').map(function(item) {
    return item.trim();
  });
  var customSplit = document.getElementById('customSplit').value.split(',').map(i=>Number(i));
  if (!validateInput(expense, totalAmount, spender, consumers)) {
    return;
  }
  if(customSplit.length === 1 && customSplit[0] === 0){ //check wherether the array is [0]
    customSplit = [];
  }
  // console.log(expense,totalAmount, spender, consumers, customSplit);
  var transaction = new Transaction(expense, totalAmount, spender, consumers, customSplit);
  transactions.push(transaction);
  displayTransactions(transactions);
  document.getElementById("transaction-form").reset();
}


// Validate form inputs
function validateInput(expense, totalAmount, spender, consumers) {
  if (expense === '' || totalAmount === '' || isNaN(totalAmount) || spender === '' || (consumers.length === 1 && consumers[0] === "")) {
    alert('Please fill in all the required fields and ensure data types are correct.');
    return false;
  }
  return true;
}


// Display the transactions in the HTML table
function displayTransactions(transactions) {
  const transactionsBody = document.getElementById('transactions-body');
  transactionsBody.innerHTML = '';
  transactions.forEach((transaction) => {
    var split = transaction.customSplit.length === 0 ? transaction.split + ' / Person' : transaction.customSplit;
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${transaction.expense}</td>
    <td>${transaction.totalAmount}</td>
    <td>${transaction.spender}</td>
    <td>${transaction.consumers.join(', ')}</td>
    <td>${split}</td>
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


function csvMaker(data) {
  csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(';'));
  data.forEach(obj => {
    const values = Object.values(obj).join(';');
    csvRows.push(values);
  });
  return csvRows.join('\n');
}

function download(data) {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', 'download.csv');
  a.click()
}


function upload(data){
  rows = data.trim().split('\n');
  for (let index = 1; index < rows.length; index++) {
    const row = rows[index].split(';');
    const expense = row[0];
    const totalAmount = parseFloat(row[1]);
    const spender = row[2];
    const consumers = row[3].split(',');
    var customSplit = row[4].split(',').map(i=>Number(i));
    if(customSplit.length === 1 && customSplit[0] === 0){
      customSplit = [];
    }
    // console.log(expense,totalAmount,spender,consumers,customSplit);
    var n = new Transaction(expense, totalAmount, spender, consumers, customSplit);
    console.log(n)
    transactions.push(n);
  }
  displayTransactions(transactions);
}

function openFile(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function() {
    var text = reader.result;
    console.log(reader.result.substring(0, 200));
    upload(reader.result);
  };
  reader.readAsText(input.files[0]);
};
