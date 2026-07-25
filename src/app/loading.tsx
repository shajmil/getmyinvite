import React from "react";
import { WeddingLoader } from "@/components/WeddingLoader";

export default function Loading() {
  return (
    <WeddingLoader
      message="Loading MakeMyInvite"
      subMessage="Preparing your wedding invitation experience..."
      fullScreen
    />
  );
}
