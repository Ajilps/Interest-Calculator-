document.addEventListener("DOMContentLoaded", () => {
  const initialAmountEl = document.getElementById("initialAmount");
  const firstDateDayEl = document.getElementById("firstDate-day");
  const firstDateMonthEl = document.getElementById("firstDate-month");
  const firstDateYearEl = document.getElementById("firstDate-year");
  const emiDateDayEl = document.getElementById("emiDate-day");
  const emiDateMonthEl = document.getElementById("emiDate-month");
  const emiDateYearEl = document.getElementById("emiDate-year");
  const emiAmountEl = document.getElementById("emiAmount");
  const addEmiBtn = document.getElementById("addEmiBtn");
  const calculateBtn = document.getElementById("calculateBtn");
  const outputEl = document.getElementById("output");
  const emiListEl = document.getElementById("emi-list");

  let emis = [];

  // Initialize with default date
  firstDateDayEl.value = "28";
  firstDateMonthEl.value = "07";
  firstDateYearEl.value = "2025";

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

  // Helper function to get date from split fields
  function getDateFromFields(dayEl, monthEl, yearEl) {
    const day = dayEl.value.trim().padStart(2, "0");
    const month = monthEl.value.trim().padStart(2, "0");
    const year = yearEl.value.trim();
    return { day, month, year };
  }

  // Helper function to validate split date fields
  function validateSplitDate(dayEl, monthEl, yearEl) {
    const day = parseInt(dayEl.value);
    const month = parseInt(monthEl.value);
    const year = parseInt(yearEl.value);

    if (!dayEl.value || !monthEl.value || !yearEl.value) {
      return { valid: false, message: "Please fill in all date fields" };
    }

    if (isNaN(day) || day < 1 || day > 31) {
      return { valid: false, message: "Day must be between 1 and 31" };
    }

    if (isNaN(month) || month < 1 || month > 12) {
      return { valid: false, message: "Month must be between 1 and 12" };
    }

    if (isNaN(year) || year < 1900 || year > 2100) {
      return { valid: false, message: "Please enter a valid year" };
    }

    // Create ISO date string and validate
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const date = new Date(isoDate);

    if (isNaN(date.getTime())) {
      return { valid: false, message: "Invalid date" };
    }

    // Check if date components match (handles invalid dates like 30-02-2025)
    if (
      date.getFullYear() !== year ||
      date.getMonth() + 1 !== month ||
      date.getDate() !== day
    ) {
      return {
        valid: false,
        message: "Invalid date (e.g., 30 Feb doesn't exist)",
      };
    }

    return { valid: true, date: date, isoDate: isoDate };
  }

  // Auto-focus to next field when current is filled
  function setupAutoFocus(dayEl, monthEl, yearEl) {
    dayEl.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
      if (e.target.value.length === 2) {
        monthEl.focus();
      }
    });

    monthEl.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
      if (e.target.value.length === 2) {
        yearEl.focus();
      }
    });

    yearEl.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
    });
  }

  // Setup auto-focus for both date field sets
  setupAutoFocus(firstDateDayEl, firstDateMonthEl, firstDateYearEl);
  setupAutoFocus(emiDateDayEl, emiDateMonthEl, emiDateYearEl);

  function validateFirstDate() {
    const errorEl = document.getElementById("firstDate-error");
    const validation = validateSplitDate(
      firstDateDayEl,
      firstDateMonthEl,
      firstDateYearEl
    );

    if (!validation.valid) {
      errorEl.textContent = validation.message;
      return false;
    }

    errorEl.textContent = "";
    return true;
  }

  function validateEmiInputs() {
    const amount = Number(emiAmountEl.value);
    const validation = validateSplitDate(
      emiDateDayEl,
      emiDateMonthEl,
      emiDateYearEl
    );

    if (!validation.valid) {
      showAlert("EMI Date: " + validation.message);
      return false;
    }

    if (amount <= 0 || !emiAmountEl.value) {
      showAlert("Please enter a valid EMI amount greater than 0.");
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
  firstDateYearEl.addEventListener("blur", validateFirstDate);

  addEmiBtn.addEventListener("click", () => {
    if (validateEmiInputs()) {
      const amount = Number(emiAmountEl.value);
      const validation = validateSplitDate(
        emiDateDayEl,
        emiDateMonthEl,
        emiDateYearEl
      );
      emis.push({ date: new Date(validation.isoDate), amount: amount });
      renderEmiList();
      emiAmountEl.value = "";
      emiDateDayEl.value = "";
      emiDateMonthEl.value = "";
      emiDateYearEl.value = "";
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
      const validation = validateSplitDate(
        firstDateDayEl,
        firstDateMonthEl,
        firstDateYearEl
      );
      const firstDate = validation.isoDate;
      const calculator = new CalculateInterest(initialAmount, firstDate, emis);
      const schedule = calculator.getInterestSchedule();
      printSchedule(schedule, calculator.finalBalance);
      outputEl.setAttribute("aria-live", "polite");
    } else {
      showAlert("Please correct the errors above.");
    }
  });

  // Download PDF button event listener
  document.getElementById("downloadPdfBtn").addEventListener("click", () => {
    if (window.calculationData) {
      const { schedule, finalBalance, initialAmount, firstDate, emis } =
        window.calculationData;
      generatePDF(schedule, finalBalance, initialAmount, firstDate, emis);
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
        const isoDate = emi.date.toISOString().split("T")[0];
        const [year, month, day] = isoDate.split("-");
        const displayDate = `${day}/${month}/${year}`;
        emiText.textContent = `${displayDate} - ₹${emi.amount.toFixed(2)}`;

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.textContent = "Remove";
        const isoDateForLabel = emi.date.toISOString().split("T")[0];
        const [yearL, monthL, dayL] = isoDateForLabel.split("-");
        const displayDateForLabel = `${dayL}/${monthL}/${yearL}`;
        removeBtn.setAttribute(
          "aria-label",
          `Remove EMI of ₹${emi.amount.toFixed(2)} on ${displayDateForLabel}`
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
    const downloadBtn = document.getElementById("downloadPdfBtn");

    // Store data globally for PDF generation
    const validation = validateSplitDate(
      firstDateDayEl,
      firstDateMonthEl,
      firstDateYearEl
    );
    window.calculationData = {
      schedule,
      finalBalance,
      initialAmount: Number(initialAmountEl.value),
      firstDate: validation.isoDate,
      emis: emis,
    };

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
      downloadBtn.style.display = "none";
      outputEl.innerHTML =
        '<div class="empty-state">No completed 28-day periods yet. Select an earlier First Date or add EMIs.</div>';
      return;
    }

    // Show download button when there are results
    downloadBtn.style.display = "block";

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

      // Calculate interest BEFORE deducting payments (on opening balance)
      const interest = this.interestFor28Days(principal);

      // Find EMIs paid within this 28-day window
      const payments = this.emis.filter(
        (emi) => emi.date >= prevDate && emi.date < date
      );

      // Sum all payments made in this period
      const totalPaid = payments.reduce((sum, e) => sum + e.amount, 0);

      // Deduct EMI payments from principal
      principal -= totalPaid;

      schedule.push({
        startDate: new Date(prevDate),
        endDate: new Date(date),
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

function generatePDF(schedule, finalBalance, initialAmount, firstDate, emis) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Helper functions

  const toINR = (n) => `Rs. ${n.toLocaleString("en-IN")}`;

  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // Calculate totals
  const totals = schedule.reduce(
    (acc, p) => {
      acc.paid += p.totalPaid;
      acc.interest += p.interest;
      return acc;
    },
    { paid: 0, interest: 0 }
  );

  // PDF Header
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235);
  doc.text("Interest Calculator Report", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 105, 28, {
    align: "center",
  });

  // Initial Information
  let yPos = 45;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Initial Setup", 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Initial Amount: ${toINR(initialAmount)}`, 25, yPos);
  yPos += 6;
  doc.text(`First Date: ${fmt(firstDate)}`, 25, yPos);
  yPos += 6;
  doc.text(`Number of EMIs: ${emis.length}`, 25, yPos);
  yPos += 15;

  // Summary Section
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Summary", 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, 170, 25, "F");

  doc.text(`Total Paid: ${toINR(totals.paid)}`, 25, yPos);
  yPos += 7;
  doc.text(`Total Interest: ${toINR(totals.interest)}`, 25, yPos);
  yPos += 7;
  doc.setFont(undefined, "bold");
  doc.text(`Final Balance: ${toINR(finalBalance)}`, 25, yPos);
  doc.setFont(undefined, "normal");
  yPos += 15;

  // Period Details
  doc.setFontSize(12);
  doc.text("Period-wise Breakdown", 20, yPos);
  yPos += 10;

  // Table header
  doc.setFillColor(37, 99, 235);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, yPos - 5, 170, 8, "F");
  doc.setFontSize(9);
  doc.text("Period", 22, yPos);
  doc.text("Paid", 100, yPos);
  doc.text("Interest", 130, yPos);
  doc.text("Balance", 165, yPos);
  yPos += 8;

  // Table rows
  doc.setTextColor(0, 0, 0);
  schedule.forEach((period, index) => {
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;

      // Repeat header on new page
      doc.setFillColor(37, 99, 235);
      doc.setTextColor(255, 255, 255);
      doc.rect(20, yPos - 5, 170, 8, "F");
      doc.text("Period", 22, yPos);
      doc.text("Paid", 100, yPos);
      doc.text("Interest", 130, yPos);
      doc.text("Balance", 165, yPos);
      yPos += 8;
      doc.setTextColor(0, 0, 0);
    }

    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(20, yPos - 5, 170, 7, "F");
    }

    const periodText = `${fmt(period.startDate)} → ${fmt(period.endDate)}`;
    doc.setFontSize(7);
    doc.text(periodText, 22, yPos);
    doc.setFontSize(9);
    doc.text(toINR(period.totalPaid), 100, yPos);
    doc.text(toINR(period.interest), 130, yPos);
    doc.text(toINR(period.balance), 165, yPos);
    yPos += 7;
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
  }

  // Save the PDF
  const fileName = `Interest_Report_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
}
