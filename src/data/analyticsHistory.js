export const weeklyTicketHistory = [
  { day: "Mon", label: "May 4", total: 8, resolved: 5 },
  { day: "Tue", label: "May 5", total: 6, resolved: 4 },
  { day: "Wed", label: "May 6", total: 11, resolved: 7 },
  { day: "Thu", label: "May 7", total: 9, resolved: 6 },
  { day: "Fri", label: "May 8", total: 7, resolved: 5 },
  { day: "Sat", label: "May 9", total: 3, resolved: 0 },
  { day: "Sun", label: "May 10", total: 0, resolved: 0 },
];

export const hoursBaseline = {
  payrollTasksComplete: 4,
  invoiceTasksComplete: 1,
  donationTasksComplete: 1,
  articlesGenerated: 0,
  ticketsAutoResolved: 0,
};

// Minutes saved per automated unit
export const savingsRates = {
  perAutoResolvedTicket: 8,
  perAutoCompletePayrollTask: 90,
  perAutoCompleteInvoiceTask: 45,
  perAutoCompleteDonationTask: 30,
  perGeneratedArticle: 30,
};
