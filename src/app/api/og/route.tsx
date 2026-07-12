import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const names = searchParams.get("names") || "Arun & Meera";
    const date = searchParams.get("date") || "December 14, 2026";
    const tagline = searchParams.get("tagline") || "Save Our Date";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#faf8f5",
            border: "20px solid #855f18",
            padding: "40px",
            fontFamily: "serif",
          }}
        >
          {/* Tagline */}
          <div
            style={{
              fontSize: 24,
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "4px",
              color: "#855f18",
              marginBottom: 20,
            }}
          >
            {tagline}
          </div>

          {/* Names */}
          <div
            style={{
              fontSize: 64,
              fontWeight: "bold",
              color: "#1a1a1a",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {names}
          </div>

          {/* Divider */}
          <div
            style={{
              width: "120px",
              height: "2px",
              backgroundColor: "#e0c992",
              marginBottom: 25,
            }}
          />

          {/* Date */}
          <div
            style={{
              fontSize: 28,
              fontWeight: "semibold",
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "#666666",
            }}
          >
            {date}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err: any) {
    console.error(err);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
