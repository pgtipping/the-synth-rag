import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build the where clause based on query parameters
    const where = status ? { status } : {};

    // Fetch emails with pagination
    const emails = await prisma.inboundEmail.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.inboundEmail.count({ where });

    return NextResponse.json({
      emails,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
