import { NextResponse } from "next/server";
import { getEmailFrom, getOwnerNotifyEmail, getResendApiKey, isOwnerEmailConfigured } from "@/lib/email/env";

export async function POST() {
  if (!isOwnerEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Set OWNER_NOTIFY_EMAIL and RESEND_API_KEY in .env. Get a free Resend key at https://resend.com",
      },
      { status: 400 }
    );
  }

  const to = getOwnerNotifyEmail()!;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [to],
      subject: "UK Solar Lead Engine — test notification",
      text: "This is a test. Qualified-lead alerts will use this same inbox. Customers are not emailed.",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return NextResponse.json({ error: `Resend ${response.status}: ${body.slice(0, 240)}` }, { status: 502 });
  }

  return NextResponse.json({ sent: true, to });
}
