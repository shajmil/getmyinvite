import React from "react";
import { WeddingLoader } from "@/components/WeddingLoader";

export default function DashboardLoading() {
  return (
    <WeddingLoader
      message="Loading Dashboard"
      subMessage="Fetching your wedding invitations &amp; RSVPs..."
      fullScreen
    />
  );
}
