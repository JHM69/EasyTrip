import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma-client";
import { OpenAI } from "openai";

import * as lancedb from "@lancedb/lancedb";
import * as arrow from "apache-arrow";
import { feature } from "@turf/turf";
import { title } from "process";
import { stat } from "fs";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey:
    "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",
});

// Helper to generate embeddings using OpenAI
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

interface Trip {
  tripPlanId: string;
  [key: string]: any;
}




// GET Endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const tripPlanId = searchParams.get("tripPlanId");
    const query = searchParams.get("query");
     
    if (!tripPlanId) {
      return NextResponse.json(
        { error: "tripPlanId is required" },
        { status: 400 },
      );
    }
 
    const blogs = await prisma.blog.findMany({
      where: {
        tripPlanId: tripPlanId,
        content: {
          contains: query as string,
          mode: 'insensitive', // Optional: Makes the search case-insensitive
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json({ blogs, count: blogs.length });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 },
    );
  }
}
 
// POST Endpoint
export async function POST(request: NextRequest) {
    
  try {
    const body = await request.json();
    const { email, tripPlanId, name, content, title } = body;

    if ( !tripPlanId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const tripPlan = await prisma.tripPlan.findUnique({
      where: { id: tripPlanId },
      include: {
        members: {
          select: {
            name: true,
          },
        }
      },
    }); 


    if (content && title){
     await prisma.blog.create({
    
      data: { 
        title : title,
        author: {
          connect: {
            email: email,
          },
        },
        tripPlan: {
          connect: {
            id: tripPlanId,
          },
        },
        content: content || "",
        tripPlanId: tripPlanId, 
      },
    });

    await prisma.notification.create({
      data: {
        content: `New blog post created by ${name} for trip: ${tripPlan?.data?.name} : ${title}`, 
        tripPlan:{
          connect: {
            id: tripPlanId,
          },
        }
      },
    });


    return NextResponse.json(
      { status: "success" },
      { status: 200 },
    );

    }
  
    const uri = "/tmp/lancedb/";
    const db = await lancedb.connect(uri);
  
    const tableNames = await db.tableNames();
    console.log(tableNames);
    let images = [];
    if(tableNames.includes("image")) { 
      const _tbl = await db.openTable("image");
            images = (await _tbl.query().limit(30).toArray())
        .filter((image) => image.tripPlanId === tripPlanId && image.email === email)
        .slice(0, 3);
    }


    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `You are ${name}, a travel blogger. Write a captivating travel blog about your recent trip titled: "${tripPlan?.data?.name}". Include details about your experience, the journey, and the group members: ${tripPlan?.members.map(member => member.name).join(", ")}. 
          
          The trip information is provided below in JSON format: ${JSON.stringify(tripPlan)}.
          
          Try to extract stories from the included images, and enrich the blog with imagery-based details. Give the blog a personal touch and make it engaging for your readers.`,
        },
        ...images.map(image => ({
          role: "user",
          content: {
            type: "image_url",
            image_url: {
              url: image.url
            }
          }
        }))
      ],
    });

    const content = visionResponse.choices[0].message.content;
  
    return NextResponse.json({ success: true, content, title : `Travel Blog: ${tripPlan?.data?.name} by ${name}` }, { status: 200 });

  } catch (error) {
    console.error(`Error in POST /api/image: ${error.message}`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

  

  