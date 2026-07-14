import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GetMyInvite | Premium Digital Wedding Invitations";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #131519 0%, #1e2229 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
          color: "white",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Border frame */}
        <div
          style={{
            position: "absolute",
            inset: "30px",
            border: "2px solid rgba(133, 95, 24, 0.3)",
            borderRadius: "20px",
            pointerEvents: "none",
          }}
        />
        
        {/* Heart/Ornament logo */}
        <div
          style={{
            fontSize: "64px",
            color: "#855f18",
            marginBottom: "20px",
          }}
        >
          ❦
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "60px",
            fontWeight: "bold",
            textAlign: "center",
            letterSpacing: "2px",
            marginBottom: "15px",
          }}
        >
          GetMyInvite
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "24px",
            color: "rgba(255, 255, 255, 0.7)",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: "1.4",
            fontFamily: "sans-serif",
            letterSpacing: "1px",
          }}
        >
          Create a beautiful wedding invitation website & collect guest RSVPs online.
        </div>

        {/* CTA Label */}
        <div
          style={{
            marginTop: "40px",
            padding: "10px 24px",
            background: "#855f18",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "30px",
            fontFamily: "sans-serif",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          Build Yours For Free
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
