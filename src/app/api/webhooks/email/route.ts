import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";

/**
 * SendGrid Inbound Parse Webhook Handler
 *
 * This endpoint receives parsed emails from SendGrid's Inbound Parse feature.
 * It processes the email data and stores it for later retrieval.
 *
 * For more information on the payload format, see:
 * https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
 */
export async function POST(request: Request) {
  try {
    // Log the incoming request for debugging
    console.log("Received email webhook");

    // Parse the form data from SendGrid
    const formData = await request.formData();

    // Extract email data
    const from = formData.get("from") as string;
    const to = formData.get("to") as string;
    const subject = (formData.get("subject") as string) || "(No Subject)";
    const text = (formData.get("text") as string) || "";
    const htmlContent = (formData.get("html") as string) || "";
    const receivedAt = new Date();

    // Log the email details
    console.log({
      from,
      to,
      subject,
      receivedAt,
      textLength: text?.length,
      htmlLength: htmlContent?.length,
    });

    // Store the email in the database
    const email = await prisma.inboundEmail.create({
      data: {
        from,
        to,
        subject,
        textContent: text,
        htmlContent,
        receivedAt,
        status: "UNREAD",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email received and stored successfully",
      emailId: email.id,
      timestamp: receivedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error processing email webhook:", error);

    // Return an error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process email",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// SendGrid may send a test GET request to verify the endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Email webhook endpoint is active",
  });
}
