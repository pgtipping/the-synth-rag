import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { inboundEmailId, content, subject } = await request.json();

    // Get original email
    const originalEmail = await prisma.inboundEmail.findUnique({
      where: { id: inboundEmailId },
    });

    if (!originalEmail) {
      return NextResponse.json(
        { error: "Original email not found" },
        { status: 404 }
      );
    }

    // Prepare email data
    const from = "hello@synthbots.synthalyst.com"; // Use your configured sending domain
    const to = originalEmail.from;
    const emailSubject = subject || `Re: ${originalEmail.subject}`;

    // Send email via SendGrid
    try {
      const msg = {
        to,
        from,
        subject: emailSubject,
        text: content,
      };

      await sgMail.send(msg);

      // Store outbound email in database
      const outboundEmail = await prisma.outboundEmail.create({
        data: {
          to,
          from,
          subject: emailSubject,
          textContent: content,
          sentAt: new Date(),
          status: "SENT",
          inReplyTo: inboundEmailId,
        },
      });

      // Update original email status
      await prisma.inboundEmail.update({
        where: { id: inboundEmailId },
        data: { status: "REPLIED" },
      });

      return NextResponse.json({
        success: true,
        emailId: outboundEmail.id,
      });
    } catch (sendError) {
      console.error("SendGrid error:", sendError);

      // Store as failed email
      const outboundEmail = await prisma.outboundEmail.create({
        data: {
          to,
          from,
          subject: emailSubject,
          textContent: content,
          sentAt: new Date(),
          status: "FAILED",
          inReplyTo: inboundEmailId,
        },
      });

      return NextResponse.json(
        {
          error: "Failed to send email",
          details:
            sendError instanceof Error ? sendError.message : "Unknown error",
          emailId: outboundEmail.id,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email reply error:", error);
    return NextResponse.json(
      { error: "Failed to process reply" },
      { status: 500 }
    );
  }
}
