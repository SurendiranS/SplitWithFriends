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
  delete(spender, consumer, amount) {
    if (spender > consumer) {
      const key = spender + '*' + consumer;
      this.db[key] -= amount;
    }
    else if (spender < consumer) {
      const key = consumer + '*' + spender;
      this.db[key] += amount;
    }
  }
  getSummary() {
    const summary = [];
    for (const i in this.db) {
      if (this.db[i] !== 0) {
        var settlement = {
          sender: "",
          receiver: ""
        };
        if (this.db[i] < 0) {
          [settlement.sender, settlement.receiver] = i.split('*');
          settlement.amount = Math.round(((this.db[i] * -1) + Number.EPSILON) * 100) / 100;
        } else {
          [settlement.receiver, settlement.sender] = i.split('*');
          settlement.amount = Math.round((this.db[i] + Number.EPSILON) * 100) / 100;
        }
        if (settlement.amount > 0)
          summary.push(settlement);
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
      this.split = Math.round(((totalAmount / (consumers.length)) + Number.EPSILON) * 100) / 100;
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
  deleteTransaction() {
    if (this.customSplit.length === 0) {
      for (const consumer of this.consumers) {
        Transaction.db.delete(this.spender, consumer, this.split);
      }
    }
    else {
      for (let i = 0; i < this.consumers.length; i++) {
        const consumer = this.consumers[i];
        const amount = this.customSplit[i];
        // Transaction.db.insert(spender, consumer, amount);
        Transaction.db.delete(this.spender, consumer, amount);
      }
    }

  }
  static getDB() {
    return Transaction.db;
  }
  static getSummary() {
    var summary = Transaction.db.getSummary();
    summary.sort(function(a, b){return a.sender >= b.sender ? 1 : -1});
    console.log(summary);
    return summary;
  }
}


var transactions = [];
//DisplayTransactions(transactions);
//Insert Transactions
function insertTransaction(event) {
  createTransaction(document.getElementById('expense').value, document.getElementById('totalAmount').value, document.getElementById('spender').value, document.getElementById('consumers').value, document.getElementById('customSplit').value);
}


// Create a new Transaction and display the summary
function createTransaction(expense, TotalAmount, Spender, Consumers, CustomSplit) {
  console.log(expense, TotalAmount, Spender, Consumers, CustomSplit);
  const totalAmount = parseFloat(TotalAmount.trim());
  const spender = Spender.trim().toUpperCase();
  const consumers = Consumers.split(',').map(function (item) {
    return item.trim().toUpperCase();
  });
  var customSplit = CustomSplit.split(',').map(i => Number(i));
  if (!validateInput(expense, totalAmount, spender, consumers)) {
    return;
  }
  if (customSplit.length === 1 && customSplit[0] === 0) { //check wherether the array is [0]
    customSplit = [];
  }
  else {
    const sum = customSplit.reduce((a, b) => a + b, 0);
    if (consumers.length > customSplit.length && sum < totalAmount) {
      const len = customSplit.length;
      while (customSplit.length < consumers.length) {
        customSplit.push((totalAmount - sum) / (consumers.length - len));
      }
    }
    else if ((consumers.length === customSplit.length && sum !== totalAmount) || (consumers.length > customSplit.length && sum >= totalAmount) || (consumers.length < customSplit.length)) {
      alert('1. Custom Split entries must be less than or equal to Consumers.\n2. Sum of Custom Split cannot exceed Total Amount.');
      return;
    }
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
  var sno = 0;
  transactions.forEach((transaction) => {
    var split = transaction.customSplit.length === 0 ? transaction.split + ' / Person' : transaction.customSplit;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${sno + 1 + '.'}</td>
      <td>${transaction.expense}</td>
      <td>&#8377; ${transaction.totalAmount}</td>
      <td>${transaction.spender}</td>
      <td>${transaction.consumers.join(', ')}</td>
      <td>${split}</td>
      <td>
        <button style="border: none;outline:none; padding:0; background:none;" type="button" onclick="removeTransaction(${sno})">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"  viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"></path></svg>
        </button>
        </button>
      </td>
    `;
    sno += 1;
    transactionsBody.appendChild(row);
  });
}


function removeTransaction(index) {
  transactions[index].deleteTransaction();
  transactions.splice(index, 1);
  displayTransactions(transactions);
  displaySummary();
}

// Display the summary in the HTML
function displaySummary() {
  var summary = Transaction.getSummary();
  const summaryList = document.getElementById('summary-list');
  summaryList.innerHTML = '';

  summary.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `${item.sender} pays ${item.receiver} &#8377; ${item.amount}`;
    summaryList.appendChild(li);
  });
  console.log(Transaction.getSummary())
}


function csvMaker(data) {
  csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));
  data.forEach(obj => {
    const values = Object.values(obj);
    const convertedValues = values.map(value => {
      if (Array.isArray(value)) {
        const result = value.join(',');
        return result.includes(',') ? '"' + result + '"' : result;
      }
      return value;
    });
    csvRows.push(convertedValues.join(','));
  });
  return csvRows.join('\n');
}


function download(data) {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', 'Transactions.csv');
  a.click()
}


function upload(data) {
  const lines = data.trim().split('\n');
  const csv = [];
  lines.forEach(line => {
    const values = [];
    let current = '';
    let withinQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === ',' && !withinQuotes) {
        values.push(current.trim());
        current = '';
      } else if (char === '"') {
        withinQuotes = !withinQuotes;
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    csv.push(values);
  });
  csv.shift();
  csv.forEach(row => {
    createTransaction(row[0], row[1], row[2], row[3], row[4]);
  });
  displayTransactions(transactions);
}


function openFile(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function () {
    var text = reader.result;
    console.log(reader.result.substring(0, 200));
    upload(reader.result);
  };
  reader.readAsText(input.files[0]);
}
