export function useWhatsApp() {
  function getWhatsAppLink(phone: string, message: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // Handle Indian phone numbers
    if (cleaned.length === 10) {
      // 10-digit number, prepend country code
      cleaned = "91" + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
      // Already has country code, use as-is
      cleaned = cleaned;
    } else if (cleaned.length > 10 && !cleaned.startsWith("91")) {
      // Has some other prefix, assume last 10 digits are the number
      cleaned = "91" + cleaned.slice(-10);
    }

    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleaned}?text=${encoded}`;
  }

  function getReminderMessage(memberName: string, planName: string, dueDate: string): string {
    return `Hi ${memberName}, this is a reminder that your ${planName} subscription is due on ${dueDate}. Please renew at your earliest convenience. Thank you!`;
  }

  function getPaymentReminderMessage(memberName: string, amount: string): string {
    return `Hi ${memberName}, you have a pending payment of ${amount}. Please complete your payment at your earliest convenience. Thank you!`;
  }

  function getInviteMessage(orgName: string, inviteUrl: string): string {
    return `Hi! You've been invited to join *${orgName}* as a staff member on MemberBook.\n\nClick here to accept: ${inviteUrl}\n\nThis invitation expires in 48 hours.`;
  }

  return { getWhatsAppLink, getReminderMessage, getPaymentReminderMessage, getInviteMessage };
}
