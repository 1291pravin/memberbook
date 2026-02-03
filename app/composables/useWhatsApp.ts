export function useWhatsApp() {
  function getWhatsAppLink(phone: string, message: string): string {
    const cleaned = phone.replace(/\D/g, "");
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
