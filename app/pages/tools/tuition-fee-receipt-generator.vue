<template>
  <div>
    <!-- Hero -->
    <section class="bg-slate-50 py-14 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <!-- Breadcrumb -->
        <nav class="flex items-center justify-center gap-1.5 text-sm text-slate-600 mb-6">
          <NuxtLink to="/" class="hover:text-primary-600 transition-colors">Home</NuxtLink>
          <span class="text-slate-400">/</span>
          <NuxtLink to="/tools" class="hover:text-primary-600 transition-colors">Free Tools</NuxtLink>
          <span class="text-slate-400">/</span>
          <span class="text-slate-700 font-medium">Tuition Fee Receipt Generator</span>
        </nav>
        <h1 class="text-4xl font-bold text-slate-800">
          Free Tuition Fee Receipt Generator
        </h1>
        <p class="mt-4 text-lg text-slate-600">
          Create professional fee receipts for your coaching center or tuition class. Download as PDF instantly — free, no sign-up required.
        </p>
      </div>
    </section>

    <!-- Tool Section -->
    <section class="py-12 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-8 items-start">

          <!-- Left: Form -->
          <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-5">Receipt Details</h2>
            <form class="space-y-5" @submit.prevent>

              <!-- Institute Name (full width) -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Institute Name</label>
                <input
                  v-model="form.instituteName"
                  type="text"
                  placeholder="Sharma Coaching Centre"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
              </div>

              <!-- Two-column grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <!-- Student Name -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                  <input
                    v-model="form.studentName"
                    type="text"
                    placeholder="Priya Gupta"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                </div>

                <!-- Parent/Guardian Name -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Parent/Guardian Name</label>
                  <input
                    v-model="form.parentName"
                    type="text"
                    placeholder="Rakesh Gupta"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                </div>

                <!-- Class/Grade -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Class / Grade</label>
                  <input
                    v-model="form.classGrade"
                    type="text"
                    placeholder="Class 10"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                </div>

                <!-- Subject/Course -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Subject / Course</label>
                  <input
                    v-model="form.subject"
                    type="text"
                    placeholder="Mathematics & Science"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                </div>

                <!-- Fee Amount -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Fee Amount</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium select-none">₹</span>
                    <input
                      v-model="form.amount"
                      type="number"
                      min="0"
                      placeholder="2500"
                      class="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                  </div>
                </div>

                <!-- Payment Method -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    v-model="form.paymentMethod"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <!-- Payment Date -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                  <input
                    v-model="form.paymentDate"
                    type="date"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                </div>

                <!-- Month Covered -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Month Covered</label>
                  <div class="flex gap-2">
                    <select
                      v-model="form.monthCovered"
                      class="flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option v-for="month in months" :key="month" :value="month">{{ month }}</option>
                    </select>
                    <input
                      v-model="form.yearCovered"
                      type="number"
                      min="2000"
                      max="2100"
                      class="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                  </div>
                </div>

                <!-- Receipt Serial Number -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Receipt Serial No.</label>
                  <input
                    v-model="form.serialNumber"
                    type="text"
                    placeholder="RCP-001"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                </div>

              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3 pt-1">
                <AppButton variant="secondary" size="md" type="button" @click="resetForm">
                  Reset
                </AppButton>
                <AppButton variant="primary" size="md" type="button" :loading="isGenerating" @click="downloadPDF">
                  Download PDF
                </AppButton>
              </div>

            </form>
          </div>

          <!-- Right: Preview -->
          <div class="lg:sticky lg:top-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">Receipt Preview</h2>
            <div class="bg-white border border-slate-200 rounded-lg p-6 shadow-sm font-mono text-sm">

              <!-- Institute Name -->
              <div class="text-center border-b-2 border-slate-800 pb-3 mb-3">
                <div class="text-base font-bold text-slate-800 uppercase tracking-wide">
                  {{ form.instituteName || 'Institute Name' }}
                </div>
                <div class="text-xs text-slate-600 mt-0.5 font-semibold tracking-wider uppercase">
                  Fee Receipt
                </div>
              </div>

              <!-- Receipt No + Date -->
              <div class="flex justify-between text-xs mb-3 pb-3 border-b border-slate-300">
                <span><span class="text-slate-500">Receipt No:</span> <span class="text-slate-800 font-semibold">{{ form.serialNumber || 'RCP-001' }}</span></span>
                <span><span class="text-slate-500">Date:</span> <span class="text-slate-800 font-semibold">{{ displayDate }}</span></span>
              </div>

              <!-- Student Details -->
              <div class="space-y-1.5 text-xs mb-3 pb-3 border-b border-slate-300">
                <div class="flex gap-2">
                  <span class="text-slate-500 w-32 shrink-0">Student Name</span>
                  <span class="text-slate-800 font-medium">{{ form.studentName || '—' }}</span>
                </div>
                <div class="flex gap-2">
                  <span class="text-slate-500 w-32 shrink-0">Parent/Guardian</span>
                  <span class="text-slate-800 font-medium">{{ form.parentName || '—' }}</span>
                </div>
                <div class="flex gap-2">
                  <span class="text-slate-500 w-32 shrink-0">Class / Grade</span>
                  <span class="text-slate-800 font-medium">{{ form.classGrade || '—' }}</span>
                </div>
                <div class="flex gap-2">
                  <span class="text-slate-500 w-32 shrink-0">Subject / Course</span>
                  <span class="text-slate-800 font-medium">{{ form.subject || '—' }}</span>
                </div>
              </div>

              <!-- Month + Payment -->
              <div class="space-y-1.5 text-xs mb-4 pb-3 border-b border-slate-300">
                <div class="flex gap-2">
                  <span class="text-slate-500 w-32 shrink-0">Month Covered</span>
                  <span class="text-slate-800 font-medium">{{ form.monthCovered }} {{ form.yearCovered }}</span>
                </div>
                <div class="flex gap-2">
                  <span class="text-slate-500 w-32 shrink-0">Payment Method</span>
                  <span class="text-slate-800 font-medium">{{ form.paymentMethod }}</span>
                </div>
              </div>

              <!-- Amount Box -->
              <div class="border-2 border-slate-800 rounded p-3 text-center mb-4">
                <div class="text-xs text-slate-500 mb-0.5">Fee Amount</div>
                <div class="text-xl font-bold text-slate-800">{{ formattedAmount }}</div>
              </div>

              <!-- Footer -->
              <div class="text-center border-t-2 border-slate-800 pt-3">
                <div class="text-xs text-slate-700 font-semibold tracking-wide">Received With Thanks ✓</div>
                <div class="mt-4 flex justify-end">
                  <div class="text-xs text-slate-500 text-right">
                    <div class="border-t border-slate-400 pt-1 w-32">Authorised Signature</div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Download button below preview -->
            <div class="mt-4">
              <AppButton variant="primary" size="lg" type="button" class="w-full" :loading="isGenerating" @click="downloadPDF">
                Download PDF
              </AppButton>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Conversion CTA -->
    <section class="py-12 px-4">
      <div class="max-w-3xl mx-auto">
        <div class="bg-primary-50 border border-primary-200 rounded-xl p-6">
          <p class="text-slate-700 text-base mb-4">
            Need to generate receipts for 40 students every month?
            <strong class="text-slate-800">MemberBook records every payment automatically</strong>
            and keeps a full fee history for every student.
          </p>
          <NuxtLink to="/register">
            <AppButton variant="primary" size="md">
              Try MemberBook Free →
            </AppButton>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-12 px-4 bg-slate-50">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-semibold text-slate-800 mb-8">Frequently Asked Questions</h2>
        <div class="space-y-6">

          <div v-for="faq in faqs" :key="faq.q" class="bg-white rounded-xl border border-slate-200 p-6">
            <h3 class="text-base font-semibold text-slate-800 mb-2">{{ faq.q }}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">{{ faq.a }}</p>
          </div>

        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";

// ── SEO ──────────────────────────────────────────────────────────────────────

useSeoMeta({
  title: "Free Tuition Fee Receipt Generator — Download PDF Instantly",
  description: "Generate professional tuition fee receipts for your coaching center. Download as PDF instantly. Free, no sign-up. Supports all payment methods.",
  ogTitle: "Free Tuition Fee Receipt Generator — Download PDF Instantly",
  ogDescription: "Generate professional tuition fee receipts for your coaching center. Download as PDF instantly. Free, no sign-up. Supports all payment methods.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/tools/tuition-fee-receipt-generator`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Free Tuition Fee Receipt Generator — Download PDF Instantly",
  twitterDescription: "Generate professional tuition fee receipts for your coaching center. Download as PDF instantly. Free, no sign-up. Supports all payment methods.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/tools/tuition-fee-receipt-generator` },
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Free Tuition Fee Receipt Generator",
        "description": "Generate professional PDF tuition fee receipts for coaching centers and tuition classes in India",
        "url": `${appUrl}/tools/tuition-fee-receipt-generator`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
        },
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": appUrl,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Free Tools",
            "item": `${appUrl}/tools`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Tuition Fee Receipt Generator",
            "item": `${appUrl}/tools/tuition-fee-receipt-generator`,
          },
        ],
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is the correct format for a tuition fee receipt in India?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A proper tuition fee receipt should include the institute name, student name, class/grade, fee amount, payment date, receipt number, and payment method. Optionally, it should also mention the month for which fees are being paid and the parent or guardian's name. This tool generates receipts that include all these required fields.",
            },
          },
          {
            "@type": "Question",
            "name": "Is GST applicable on tuition and coaching class fees?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Educational services including tuition are generally exempt from GST under heading 9992. However, coaching institutes registered for GST may have different obligations depending on their structure and annual turnover. Coaching institutes should consult a tax professional to understand their specific GST liability.",
            },
          },
          {
            "@type": "Question",
            "name": "Can I use this receipt for tax purposes?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, receipts generated by this tool include all standard information required for fee documentation. However, for official tax deduction claims, ensure your institute's name and address are accurate. For school fee receipts under Section 80C, the receipt format must match what the income tax department expects.",
            },
          },
          {
            "@type": "Question",
            "name": "How do I create a professional receipt for my coaching center?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A professional receipt should have a consistent format with your institute's name, a sequential receipt number, complete student details, the fee amount clearly stated, and a signature section. Using this free tool ensures your receipts follow a standard, professional layout every time.",
            },
          },
          {
            "@type": "Question",
            "name": "What details should a tuition fee receipt include?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Essential details include: institute name, receipt serial number, date, student name, parent/guardian name, class/grade, subjects or courses, fee amount in figures, payment method, and the month covered. An authorised signature line adds credibility.",
            },
          },
          {
            "@type": "Question",
            "name": "How do I generate receipts for multiple students quickly?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For small batches, this free tool works well — just fill the details and download. For 20 or more students monthly, a dedicated software like MemberBook can auto-generate receipts when payments are recorded, saving hours of manual work each month.",
            },
          },
          {
            "@type": "Question",
            "name": "Is this receipt format valid for parents claiming deductions?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Parents can use tuition fee receipts for education allowance claims under Section 80C for school fees. For coaching class fees specifically, the deduction eligibility depends on the nature of the institute. Check with a tax advisor for guidance specific to your situation.",
            },
          },
        ],
      }),
    },
  ],
});

// ── State ─────────────────────────────────────────────────────────────────────

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();

const form = reactive({
  instituteName: "",
  studentName: "",
  parentName: "",
  classGrade: "",
  subject: "",
  amount: "",
  paymentMethod: "Cash",
  paymentDate: new Date().toISOString().split("T")[0],
  monthCovered: months[new Date().getMonth()],
  yearCovered: currentYear.toString(),
  serialNumber: "RCP-001",
});

const isGenerating = ref(false);

// ── Computed ──────────────────────────────────────────────────────────────────

const formattedAmount = computed(() =>
  form.amount ? `₹${Number(form.amount).toLocaleString("en-IN")}` : "₹0",
);

const displayDate = computed(() => {
  if (!form.paymentDate) return "—";
  const [y, m, d] = form.paymentDate.split("-");
  return `${d}/${m}/${y}`;
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  form.serialNumber = `RCP-${Date.now().toString().slice(-3).padStart(3, "0")}`;
});

// ── Actions ───────────────────────────────────────────────────────────────────

function resetForm() {
  form.instituteName = "";
  form.studentName = "";
  form.parentName = "";
  form.classGrade = "";
  form.subject = "";
  form.amount = "";
  form.paymentMethod = "Cash";
  form.paymentDate = new Date().toISOString().split("T")[0];
  form.monthCovered = months[new Date().getMonth()];
  form.yearCovered = currentYear.toString();
  form.serialNumber = `RCP-${Date.now().toString().slice(-3).padStart(3, "0")}`;
}

async function downloadPDF() {
  if (isGenerating.value) return;
  isGenerating.value = true;

  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a5" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // Helpers
    const centerX = pageWidth / 2;

    function drawLine(y: number, color = "#cccccc") {
      doc.setDrawColor(color);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
    }

    function labelValue(label: string, value: string, y: number, labelX = margin, valueX = margin + 40) {
      doc.setFontSize(9);
      doc.setTextColor("#666666");
      doc.text(label, labelX, y);
      doc.setTextColor("#111111");
      doc.text(value || "—", valueX, y);
    }

    let y = 16;

    // ── Institute Name ──
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#111111");
    const instituteName = form.instituteName || "Institute Name";
    doc.text(instituteName.toUpperCase(), centerX, y, { align: "center" });
    y += 7;

    // ── "Fee Receipt" subtitle ──
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#444444");
    doc.text("FEE RECEIPT", centerX, y, { align: "center" });
    y += 4;

    // ── Top rule ──
    doc.setDrawColor("#111111");
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // ── Receipt No + Date on same row ──
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#666666");
    doc.text("Receipt No:", margin, y);
    doc.setTextColor("#111111");
    doc.text(form.serialNumber || "RCP-001", margin + 22, y);

    doc.setTextColor("#666666");
    const dateLabel = "Date:";
    const dateValue = displayDate.value;
    const dateValueWidth = doc.getTextWidth(dateValue);
    const dateLabelWidth = doc.getTextWidth(dateLabel);
    doc.text(dateLabel, pageWidth - margin - dateLabelWidth - dateValueWidth - 2, y);
    doc.setTextColor("#111111");
    doc.text(dateValue, pageWidth - margin - dateValueWidth, y);
    y += 5;

    drawLine(y);
    y += 5;

    // ── Student Details ──
    doc.setFont("helvetica", "normal");
    labelValue("Student Name", form.studentName, y);
    y += 6;
    labelValue("Parent/Guardian", form.parentName, y);
    y += 6;
    labelValue("Class / Grade", form.classGrade, y);
    y += 6;
    labelValue("Subject / Course", form.subject, y);
    y += 5;

    drawLine(y);
    y += 5;

    // ── Month + Payment Method ──
    labelValue("Month Covered", `${form.monthCovered} ${form.yearCovered}`, y);
    y += 6;
    labelValue("Payment Method", form.paymentMethod, y);
    y += 5;

    drawLine(y);
    y += 6;

    // ── Amount Box ──
    const boxHeight = 20;
    const boxY = y;
    doc.setDrawColor("#111111");
    doc.setLineWidth(0.5);
    doc.rect(margin, boxY, contentWidth, boxHeight);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#666666");
    doc.text("Fee Amount", centerX, boxY + 6, { align: "center" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#111111");
    const amountText = form.amount
      ? `Rs. ${Number(form.amount).toLocaleString("en-IN")}`
      : "Rs. 0";
    doc.text(amountText, centerX, boxY + 14, { align: "center" });

    y += boxHeight + 6;

    // ── Bottom rule ──
    doc.setDrawColor("#111111");
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // ── Received With Thanks ──
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#111111");
    doc.text("Received With Thanks", centerX, y, { align: "center" });
    y += 14;

    // ── Signature line ──
    doc.setDrawColor("#aaaaaa");
    doc.setLineWidth(0.3);
    const sigLineWidth = 45;
    doc.line(pageWidth - margin - sigLineWidth, y, pageWidth - margin, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#888888");
    doc.text("Authorised Signature", pageWidth - margin - sigLineWidth / 2, y, { align: "center" });

    doc.save(`receipt-${form.serialNumber || "RCP"}.pdf`);
  }
  finally {
    isGenerating.value = false;
  }
}

// ── FAQ Data ──────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "What is the correct format for a tuition fee receipt in India?",
    a: "A proper tuition fee receipt should include the institute name, student name, class/grade, fee amount, payment date, receipt number, and payment method. Optionally, it should also mention the month for which fees are being paid and the parent or guardian's name. This tool generates receipts that include all these required fields.",
  },
  {
    q: "Is GST applicable on tuition and coaching class fees?",
    a: "Educational services including tuition are generally exempt from GST under heading 9992. However, coaching institutes registered for GST may have different obligations depending on their structure and annual turnover. Coaching institutes should consult a tax professional to understand their specific GST liability.",
  },
  {
    q: "Can I use this receipt for tax purposes?",
    a: "Yes, receipts generated by this tool include all standard information required for fee documentation. However, for official tax deduction claims, ensure your institute's name and address are accurate. For school fee receipts under Section 80C, the receipt format must match what the income tax department expects.",
  },
  {
    q: "How do I create a professional receipt for my coaching center?",
    a: "A professional receipt should have a consistent format with your institute's name, a sequential receipt number, complete student details, the fee amount clearly stated, and a signature section. Using this free tool ensures your receipts follow a standard, professional layout every time.",
  },
  {
    q: "What details should a tuition fee receipt include?",
    a: "Essential details include: institute name, receipt serial number, date, student name, parent/guardian name, class/grade, subjects or courses, fee amount in figures, payment method, and the month covered. An authorised signature line adds credibility.",
  },
  {
    q: "How do I generate receipts for multiple students quickly?",
    a: "For small batches, this free tool works well — just fill the details and download. For 20 or more students monthly, a dedicated software like MemberBook can auto-generate receipts when payments are recorded, saving hours of manual work each month.",
  },
  {
    q: "Is this receipt format valid for parents claiming deductions?",
    a: "Parents can use tuition fee receipts for education allowance claims under Section 80C for school fees. For coaching class fees specifically, the deduction eligibility depends on the nature of the institute. Check with a tax advisor for guidance specific to your situation.",
  },
];
</script>
