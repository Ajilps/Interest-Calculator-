document.addEventListener("DOMContentLoaded", () => {
  const initialAmountEl = document.getElementById("initialAmount");
  const firstDateEl = document.getElementById("firstDate");
  const emiDateEl = document.getElementById("emiDate");
  const emiAmountEl = document.getElementById("emiAmount");
  const addEmiBtn = document.getElementById("addEmiBtn");
  const calculateBtn = document.getElementById("calculateBtn");
  const outputEl = document.getElementById("output");
  const emiListEl = document.getElementById("emi-list");

  let emis = [];

  // --- Event Listeners ---

  addEmiBtn.addEventListener("click", () => {
    const amount = Number(emiAmountEl.value);
    const date = emiDateEl.value;

    if (amount > 0 && date) {
      emis.push({ date: new Date(date), amount: amount });
      renderEmiList();
      emiAmountEl.value = "";
      emiDateEl.value = "";
    } else {
      alert("Please enter a valid date and amount.");
    }
  });

  calculateBtn.addEventListener("click", () => {
    const initialAmount = Number(initialAmountEl.value);
    const firstDate = firstDateEl.value;

    if (initialAmount > 0 && firstDate) {
      const calculator = new CalculateInterest(initialAmount, firstDate, emis);
      const schedule = calculator.getInterestSchedule();
      printSchedule(schedule, calculator.finalBalance);
    } else {
      alert("Please enter a valid initial amount and start date.");
    }
  });

  function renderEmiList() {
    emiListEl.innerHTML = "";
    emis
      .sort((a, b) => a.date - b.date)
      .forEach((emi) => {
        const emiDiv = document.createElement("div");
        emiDiv.className = "emi-entry";
        emiDiv.textContent = `${
          emi.date.toISOString().split("T")[0]
        } - ₹${emi.amount.toFixed(2)}`;
        emiListEl.appendChild(emiDiv);
      });
  }

  function printSchedule(schedule, finalBalance) {
    const toINR = (n) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(n);

    const fmt = (d) =>
      new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    const totals = schedule.reduce(
      (acc, p) => {
        acc.paid += p.totalPaid;
        acc.interest += p.interest;
        return acc;
      },
      { paid: 0, interest: 0 }
    );

    if (schedule.length === 0) {
      outputEl.innerHTML =
        '<div class="card metric"><div class="metric-label">No completed 28-day periods yet</div><div class="metric-value muted">Select an earlier First Date or add EMIs.</div></div>';
      return;
    }

    let html = "";

    // Summary metrics
    html += '<div class="summary-cards">';
    html += `<div class="card metric"><div class="metric-label">Total Paid</div><div class="metric-value">${toINR(
      totals.paid
    )}</div></div>`;
    html += `<div class="card metric"><div class="metric-label">Total Interest</div><div class="metric-value">${toINR(
      totals.interest
    )}</div></div>`;
    html += `<div class="card metric"><div class="metric-label">Final Balance</div><div class="metric-value">${toINR(
      finalBalance
    )}</div></div>`;
    html += "</div>";

    // Per-period cards
    schedule.forEach((period) => {
      html += `
        <div class="result-card">
          <div class="result-header">
            <div class="result-range">${fmt(period.startDate)} → ${fmt(
        period.endDate
      )}</div>
            <div class="result-chips">
              <span class="chip paid"><span class="dot"></span> Paid: ${toINR(
                period.totalPaid
              )}</span>
              <span class="chip interest"><span class="dot"></span> Interest: ${toINR(
                period.interest
              )}</span>
              <span class="chip balance"><span class="dot"></span> Balance: ${toINR(
                period.balance
              )}</span>
            </div>
          </div>
        </div>
      `;
    });

    outputEl.innerHTML = html;
  }
});

class CalculateInterest {
  constructor(initialAmount, firstDate, emis) {
    this.initialAmount = initialAmount;
    this.firstDate = new Date(firstDate);
    this.emis = emis; // EMIs are passed in from the UI
    this.finalBalance = 0;
  }

  // 1% interest for 28 days
  interestFor28Days(amount) {
    return amount * 0.01;
  }

  getInterestSchedule() {
    let date = new Date(this.firstDate);
    let prevDate = new Date(this.firstDate);
    let principal = this.initialAmount;
    const schedule = [];
    const today = new Date();

    while (date < today) {
      // Move date +28 days
      date.setDate(date.getDate() + 28);

      // Find EMIs paid within this 28-day window
      const payments = this.emis.filter(
        (emi) => emi.date >= prevDate && emi.date < date
      );

      // Sum all payments made in this period
      const totalPaid = payments.reduce((sum, e) => sum + e.amount, 0);

      // Deduct EMI payments from principal
      principal -= totalPaid;

      // Calculate interest for this period
      const interest = this.interestFor28Days(principal);

      // Add interest to principal (if it’s compounding)
      // principal += interest;

      schedule.push({
        startDate: prevDate,
        endDate: date,
        totalPaid: totalPaid,
        interest: interest,
        balance: principal,
      });

      // Move to next period
      prevDate = new Date(date);
    }

    this.finalBalance = principal;
    return schedule;
  }
}
