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

  // Validation functions
  function validateInitialAmount() {
    const value = Number(initialAmountEl.value);
    const errorEl = document.getElementById("initialAmount-error");
    if (!initialAmountEl.value || value <= 0) {
      errorEl.textContent = "Please enter a valid amount greater than 0.";
      initialAmountEl.setAttribute("aria-invalid", "true");
      return false;
    } else {
      errorEl.textContent = "";
      initialAmountEl.setAttribute("aria-invalid", "false");
      return true;
    }
  }

  function validateFirstDate() {
    const value = firstDateEl.value;
    const errorEl = document.getElementById("firstDate-error");
    if (!value) {
      errorEl.textContent = "Please select a valid date.";
      firstDateEl.setAttribute("aria-invalid", "true");
      return false;
    } else {
      errorEl.textContent = "";
      firstDateEl.setAttribute("aria-invalid", "false");
      return true;
    }
  }

  function validateEmiInputs() {
    const amount = Number(emiAmountEl.value);
    const date = emiDateEl.value;
    if (amount <= 0 || !date) {
      showAlert("Please enter a valid date and amount.");
      return false;
    }
    return true;
  }

  function showAlert(message) {
    // Create a temporary alert element
    const alertEl = document.createElement("div");
    alertEl.setAttribute("role", "alert");
    alertEl.setAttribute("aria-live", "assertive");
    alertEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #dc2626;
      color: white;
      padding: 1rem;
      border-radius: 8px;
      z-index: 1000;
      max-width: 90vw;
    `;
    alertEl.textContent = message;
    document.body.appendChild(alertEl);
    setTimeout(() => {
      document.body.removeChild(alertEl);
    }, 3000);
  }

  // --- Event Listeners ---

  initialAmountEl.addEventListener("blur", validateInitialAmount);
  firstDateEl.addEventListener("blur", validateFirstDate);

  addEmiBtn.addEventListener("click", () => {
    if (validateEmiInputs()) {
      const amount = Number(emiAmountEl.value);
      const date = emiDateEl.value;
      emis.push({ date: new Date(date), amount: amount });
      renderEmiList();
      emiAmountEl.value = "";
      emiDateEl.value = "";
      outputEl.innerHTML = ""; // Clear results when EMI is added
      outputEl.setAttribute("aria-live", "polite");
      outputEl.textContent = "EMI added successfully.";
      setTimeout(() => {
        outputEl.textContent = "";
      }, 1000);
    }
  });

  calculateBtn.addEventListener("click", () => {
    const isAmountValid = validateInitialAmount();
    const isDateValid = validateFirstDate();

    if (isAmountValid && isDateValid) {
      const initialAmount = Number(initialAmountEl.value);
      const firstDate = firstDateEl.value;
      const calculator = new CalculateInterest(initialAmount, firstDate, emis);
      const schedule = calculator.getInterestSchedule();
      printSchedule(schedule, calculator.finalBalance);
      outputEl.setAttribute("aria-live", "polite");
    } else {
      showAlert("Please correct the errors above.");
    }
  });

  function renderEmiList() {
    emiListEl.innerHTML = "";
    emis
      .sort((a, b) => a.date - b.date)
      .forEach((emi, index) => {
        const emiDiv = document.createElement("div");
        emiDiv.className = "emi-entry";
        emiDiv.setAttribute("role", "listitem");

        const emiText = document.createElement("span");
        emiText.textContent = `${
          emi.date.toISOString().split("T")[0]
        } - ₹${emi.amount.toFixed(2)}`;

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.textContent = "Remove";
        removeBtn.setAttribute(
          "aria-label",
          `Remove EMI of ₹${emi.amount.toFixed(2)} on ${
            emi.date.toISOString().split("T")[0]
          }`
        );
        removeBtn.addEventListener("click", () => {
          emis.splice(index, 1);
          renderEmiList();
          outputEl.innerHTML = ""; // Clear results when EMI is removed
          outputEl.setAttribute("aria-live", "polite");
          outputEl.textContent = "EMI removed successfully.";
          setTimeout(() => {
            outputEl.textContent = "";
          }, 1000);
        });

        emiDiv.appendChild(emiText);
        emiDiv.appendChild(removeBtn);
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
        '<div class="empty-state">No completed 28-day periods yet. Select an earlier First Date or add EMIs.</div>';
      return;
    }

    let html = "";

    // Summary metrics
    html += '<div class="summary-cards">';
    html += `<div class="metric-card"><div class="metric-label">Total Paid</div><div class="metric-value">${toINR(
      totals.paid
    )}</div></div>`;
    html += `<div class="metric-card"><div class="metric-label">Total Interest</div><div class="metric-value">${toINR(
      totals.interest
    )}</div></div>`;
    html += `<div class="metric-card"><div class="metric-label">Final Balance</div><div class="metric-value">${toINR(
      finalBalance
    )}</div></div>`;
    html += "</div>";

    // Check viewport width for responsive rendering
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Stacked cards for mobile
      schedule.forEach((period) => {
        html += `
          <div class="result-card">
            <div class="result-range">${fmt(period.startDate)} → ${fmt(
          period.endDate
        )}</div>
            <div class="result-details">
              <div>Paid: ${toINR(period.totalPaid)}</div>
              <div>Interest: ${toINR(period.interest)}</div>
              <div>Balance: ${toINR(period.balance)}</div>
            </div>
          </div>
        `;
      });
    } else {
      // Table for desktop
      html += `
        <table class="results-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Paid</th>
              <th>Interest</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
      `;
      schedule.forEach((period) => {
        html += `
          <tr>
            <td>${fmt(period.startDate)} → ${fmt(period.endDate)}</td>
            <td>${toINR(period.totalPaid)}</td>
            <td>${toINR(period.interest)}</td>
            <td>${toINR(period.balance)}</td>
          </tr>
        `;
      });
      html += `
          </tbody>
        </table>
      `;
    }

    outputEl.innerHTML = html;

    // Announce results update
    outputEl.setAttribute("aria-live", "polite");
    const announcement = `Results updated. Total paid: ${toINR(
      totals.paid
    )}, Total interest: ${toINR(totals.interest)}, Final balance: ${toINR(
      finalBalance
    )}. ${schedule.length} periods calculated.`;
    setTimeout(() => {
      const tempEl = document.createElement("div");
      tempEl.setAttribute("aria-live", "assertive");
      tempEl.setAttribute("aria-atomic", "true");
      tempEl.style.position = "absolute";
      tempEl.style.left = "-10000px";
      tempEl.style.width = "1px";
      tempEl.style.height = "1px";
      tempEl.style.overflow = "hidden";
      tempEl.textContent = announcement;
      document.body.appendChild(tempEl);
      setTimeout(() => {
        document.body.removeChild(tempEl);
      }, 1000);
    }, 100);
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
