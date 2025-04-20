import { NextResponse } from "next/server";
import getListings from "@/app/actions/getListings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get("skip") || "0");
  const take = parseInt(searchParams.get("take") || "12");

  const params: any = {};
  searchParams.forEach((value, key) => {
    if (key !== "skip" && key !== "take") {
      params[key] = value;
    }
  });

  const listings = await getListings({ ...params, skip, take });

  return NextResponse.json(listings);
}