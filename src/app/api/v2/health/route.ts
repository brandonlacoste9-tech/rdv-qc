import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: "healthy",
      version: "1.0.0",
      environment: process.env.NODE_ENV,
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: "degraded",
      database: "disconnected",
      error: error.message
    }, { status: 500 });
  }
}
