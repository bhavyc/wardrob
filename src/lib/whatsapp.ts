export async function sendReturnReminder(phone: string, bookingId: string, returnDate: Date) {
  // STUB: This represents the WhatsApp Cloud API integration.
  // In a real environment, this would call Meta's Graph API.
  
  const formattedDate = returnDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const message = `Wardrob Reminder: Your return pickup for booking #${bookingId.substring(0, 8).toUpperCase()} is scheduled for tomorrow (${formattedDate}) — please have the item ready.`;

  console.log(`\n[WHATSAPP API STUB] 📱 Sending message to ${phone}:`);
  console.log(`"${message}"\n`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return true;
}

export async function sendOverdueReminder(phone: string, bookingId: string, daysOverdue: number, level: 1 | 3 | 7) {
  let message = '';
  const shortId = bookingId.substring(0, 8).toUpperCase();
  
  if (level === 1) {
    message = `Wardrob Reminder: Your rental #${shortId} was due yesterday. Please arrange return immediately or contact support.`;
  } else if (level === 3) {
    message = `Wardrob Urgent: Your rental #${shortId} is ${daysOverdue} days overdue. Late fees (₹250/day) are accruing daily. Please return the item.`;
  } else if (level === 7) {
    message = `Wardrob Final Warning: Your rental #${shortId} is ${daysOverdue} days overdue. Continued non-return will result in full deposit forfeiture and account restrictions.`;
  }

  console.log(`\n[WHATSAPP API STUB] 📱 Sending Overdue Level ${level} message to ${phone}:`);
  console.log(`"${message}"\n`);

  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
}
