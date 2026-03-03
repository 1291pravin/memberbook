<template>
  <div>
    <section class="bg-slate-50 py-14 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <nav class="flex items-center justify-center gap-2 text-sm text-slate-600 mb-6">
          <NuxtLink to="/" class="hover:text-primary-600 transition-colors">Home</NuxtLink>
          <span class="text-slate-400">/</span>
          <NuxtLink to="/tools" class="hover:text-primary-600 transition-colors">Free Tools</NuxtLink>
          <span class="text-slate-400">/</span>
          <span class="text-slate-800 font-medium">GST Invoice Generator</span>
        </nav>

        <h1 class="text-4xl font-bold text-slate-800">Free GST Invoice Generator for Coaching Institutes</h1>
        <p class="mt-4 text-lg text-slate-600">Create GST-ready coaching invoices with subtotal, CGST/SGST split, and final amount in seconds.</p>
      </div>
    </section>

    <section class="py-12 px-4">
      <div class="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h2 class="text-xl font-semibold text-slate-800 mb-5">Invoice Details</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Invoice No.</label>
                <input v-model="form.invoiceNo" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Invoice Date</label>
                <input v-model="form.invoiceDate" type="date" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Institute Name</label>
              <input v-model="form.instituteName" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">GSTIN (optional)</label>
                <input v-model="form.gstin" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                <input v-model="form.studentName" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Course / Batch</label>
                <input v-model="form.courseName" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Taxable Amount (INR)</label>
                <input v-model.number="form.taxableAmount" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">GST Rate (%)</label>
                <select v-model.number="form.gstRate" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option :value="0">0%</option>
                  <option :value="5">5%</option>
                  <option :value="12">12%</option>
                  <option :value="18">18%</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Place of Supply</label>
                <input v-model="form.placeOfSupply" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <AppButton variant="secondary" size="md" type="button" @click="resetForm">Reset</AppButton>
              <AppButton variant="primary" size="md" type="button" :loading="isGenerating" @click="downloadPDF">Download PDF</AppButton>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h2 class="text-xl font-semibold text-slate-800 mb-4">Invoice Preview</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-slate-600">Invoice No.</span><span class="font-medium text-slate-800">{{ form.invoiceNo }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Date</span><span class="font-medium text-slate-800">{{ formattedDate }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Institute</span><span class="font-medium text-slate-800">{{ form.instituteName }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Student</span><span class="font-medium text-slate-800">{{ form.studentName }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Course</span><span class="font-medium text-slate-800">{{ form.courseName }}</span></div>
              <hr class="my-2">
              <div class="flex justify-between"><span class="text-slate-600">Taxable Value</span><span class="font-medium text-slate-800">{{ inr(form.taxableAmount) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">CGST ({{ form.gstRate / 2 }}%)</span><span class="font-medium text-slate-800">{{ inr(cgst) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">SGST ({{ form.gstRate / 2 }}%)</span><span class="font-medium text-slate-800">{{ inr(sgst) }}</span></div>
              <div class="flex justify-between text-base"><span class="font-semibold text-slate-800">Grand Total</span><span class="font-bold text-slate-800">{{ inr(grandTotal) }}</span></div>
            </div>
          </div>

          <div class="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <p class="text-sm text-slate-700 mb-4">
              If you generate invoices manually every month, operations break as batches grow. MemberBook auto-records tuition payments, keeps invoice history, and simplifies reconciliation.
            </p>
            <NuxtLink to="/register">
              <AppButton variant="primary" size="md">Try MemberBook Free</AppButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="py-12 px-4 bg-slate-50">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-semibold text-slate-800 mb-6">Frequently Asked Questions</h2>
        <div class="space-y-4">
          <div v-for="faq in faqs" :key="faq.q" class="bg-white border border-slate-200 rounded-xl p-5">
            <h3 class="text-base font-semibold text-slate-800 mb-2">{{ faq.q }}</h3>
            <p class="text-sm text-slate-600">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" })

const config = useRuntimeConfig()
const appUrl = config.public.appUrl || "https://memberbook.app"
const pageUrl = `${appUrl}/tools/gst-invoice-generator-coaching-institutes`

function generateInvoiceNo(): string {
  return `INV-${Date.now().toString().slice(-5)}`
}

const form = reactive({
  invoiceNo: "INV-00001",
  invoiceDate: new Date().toISOString().split("T")[0],
  instituteName: "BrightPath Coaching Institute",
  gstin: "",
  studentName: "Aarav Mehta",
  courseName: "NEET Foundation Batch",
  taxableAmount: 15000,
  gstRate: 18,
  placeOfSupply: "Maharashtra",
})

const isGenerating = ref(false)
const cgst = computed(() => Math.round((form.taxableAmount * (form.gstRate / 2)) / 100))
const sgst = computed(() => Math.round((form.taxableAmount * (form.gstRate / 2)) / 100))
const grandTotal = computed(() => form.taxableAmount + cgst.value + sgst.value)

const formattedDate = computed(() => {
  if (!form.invoiceDate) return "-"
  const d = new Date(`${form.invoiceDate}T00:00:00`)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
})

function inr(value: number): string {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`
}

function resetForm() {
  form.invoiceNo = generateInvoiceNo()
  form.invoiceDate = new Date().toISOString().split("T")[0]
  form.instituteName = ""
  form.gstin = ""
  form.studentName = ""
  form.courseName = ""
  form.taxableAmount = 0
  form.gstRate = 18
  form.placeOfSupply = ""
}

onMounted(() => {
  form.invoiceNo = generateInvoiceNo()
})

async function downloadPDF() {
  if (isGenerating.value) return
  isGenerating.value = true

  try {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF({ unit: "mm", format: "a4" })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 16
    const contentWidth = pageWidth - (margin * 2)

    const leftColX = margin
    const rightColX = margin + (contentWidth / 2)
    const valueOffset = 35

    function row(label: string, value: string, y: number, x = leftColX) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor("#666666")
      doc.text(label, x, y)
      doc.setTextColor("#111111")
      doc.text(value || "-", x + valueOffset, y)
    }

    let y = 20

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor("#111111")
    doc.text("GST INVOICE", margin, y)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor("#666666")
    doc.text("Coaching Institutes", margin, y + 5)

    doc.setDrawColor("#111111")
    doc.setLineWidth(0.5)
    doc.line(margin, y + 9, pageWidth - margin, y + 9)
    y += 16

    row("Invoice No:", form.invoiceNo || "-", y, leftColX)
    row("Date:", formattedDate.value || "-", y, rightColX)
    y += 7

    row("Institute:", form.instituteName || "-", y, leftColX)
    row("GSTIN:", form.gstin || "-", y, rightColX)
    y += 7

    row("Student:", form.studentName || "-", y, leftColX)
    row("Course:", form.courseName || "-", y, rightColX)
    y += 7

    row("Place of Supply:", form.placeOfSupply || "-", y, leftColX)
    y += 10

    doc.setDrawColor("#d1d5db")
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    const tableX = margin
    const tableWidth = contentWidth
    const labelColWidth = tableWidth * 0.7
    const amountColX = tableX + labelColWidth
    const rowHeight = 9

    doc.setDrawColor("#111111")
    doc.setLineWidth(0.3)
    doc.rect(tableX, y, tableWidth, rowHeight)
    doc.line(amountColX, y, amountColX, y + rowHeight)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor("#111111")
    doc.text("Description", tableX + 3, y + 6)
    doc.text("Amount (INR)", amountColX + 3, y + 6)
    y += rowHeight

    const rows = [
      ["Taxable Amount", inr(form.taxableAmount)],
      [`CGST (${form.gstRate / 2}%)`, inr(cgst.value)],
      [`SGST (${form.gstRate / 2}%)`, inr(sgst.value)],
    ]

    doc.setFont("helvetica", "normal")
    for (const [label, amount] of rows) {
      doc.rect(tableX, y, tableWidth, rowHeight)
      doc.line(amountColX, y, amountColX, y + rowHeight)
      doc.text(label, tableX + 3, y + 6)
      doc.text(amount, amountColX + 3, y + 6)
      y += rowHeight
    }

    doc.setDrawColor("#111111")
    doc.setFillColor(241, 245, 249)
    doc.rect(tableX, y, tableWidth, rowHeight, "FD")
    doc.line(amountColX, y, amountColX, y + rowHeight)
    doc.setFont("helvetica", "bold")
    doc.text("Grand Total", tableX + 3, y + 6)
    doc.text(inr(grandTotal.value), amountColX + 3, y + 6)
    y += rowHeight + 14

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor("#666666")
    doc.text("This is a system-generated invoice.", margin, y)
    y += 18

    doc.setDrawColor("#9ca3af")
    doc.setLineWidth(0.3)
    const sigLineWidth = 50
    doc.line(pageWidth - margin - sigLineWidth, y, pageWidth - margin, y)
    doc.setFontSize(8)
    doc.text("Authorised Signature", pageWidth - margin - (sigLineWidth / 2), y + 4, { align: "center" })

    doc.save(`${form.invoiceNo || "coaching-invoice"}.pdf`)
  }
  finally {
    isGenerating.value = false
  }
}

const faqs = [
  {
    q: "Do coaching institutes need GST invoices?",
    a: "It depends on service type, entity setup, and turnover threshold. If your institute is GST-registered, maintain proper GST invoices for compliance and audit readiness.",
  },
  {
    q: "How is CGST and SGST calculated?",
    a: "For intra-state transactions, total GST is split equally. If GST is 18 percent, CGST is 9 percent and SGST is 9 percent of taxable amount.",
  },
  {
    q: "Can this tool replace accounting software?",
    a: "It helps generate invoice drafts quickly. For full accounting, payment tracking, and reconciliation, use a system like MemberBook with reports and history.",
  },
]

useSeoMeta({
  title: "GST Invoice Generator for Coaching Institutes (Free) | MemberBook",
  description: "Create GST-ready coaching invoices with automatic subtotal, CGST/SGST split, and grand total. Free online tool.",
  ogTitle: "GST Invoice Generator for Coaching Institutes (Free) | MemberBook",
  ogDescription: "Create GST-ready coaching invoices with automatic subtotal, CGST/SGST split, and grand total. Free online tool.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: pageUrl,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "GST Invoice Generator for Coaching Institutes (Free) | MemberBook",
  twitterDescription: "Create GST-ready coaching invoices with automatic subtotal, CGST/SGST split, and grand total. Free online tool.",
  twitterImage: `${appUrl}/og-image.png`,
})

useHead({
  link: [{ rel: "canonical", href: pageUrl }],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "GST Invoice Generator for Coaching Institutes",
        description: "Free coaching GST invoice generator",
        url: pageUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web Browser",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      }),
    },
  ],
})
</script>
