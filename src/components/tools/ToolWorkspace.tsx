"use client";

import type { ToolDef } from "@/lib/tools";
import { BulkTool } from "./BulkTool";
import { ConvertTool } from "./ConvertTool";
import { CropTool } from "./CropTool";
import { DocumentCompressTool } from "./DocumentCompressTool";
import { DpiTool, SignatureTool } from "./EditTools";
import { PdfTool } from "./PdfTool";
import { PhotoTool } from "./PhotoTool";
import { SingleImageTool } from "./SingleImageTool";
import { ImageStudio } from "./ImageStudio";
import { VideoStudio } from "./StudioTools";

export function ToolWorkspace({ tool }: { tool: ToolDef }) {
  switch (tool.mode) {
    case "document-compress":
      return <DocumentCompressTool tool={tool} />;
    case "universal-convert":
      return <ConvertTool />;
    case "pdf":
      return <PdfTool />;
    case "photo":
      return <PhotoTool tool={tool} />;
    case "crop":
      return <CropTool />;
    case "dpi":
      return <DpiTool />;
    case "bg-remove":
      return <ImageStudio tool={tool} />;
    case "signature":
      return <SignatureTool />;
    case "bulk-resize":
    case "bulk-compress":
      return <BulkTool mode={tool.mode} />;
    case "color-grade":
    case "heal":
    case "photo-studio":
      return <ImageStudio tool={tool} />;
    case "video-studio":
      return <VideoStudio tool={tool} />;
    default:
      if (tool.slug === "rotate-image" || tool.slug === "flip-image" || tool.slug === "black-and-white") {
        return <ImageStudio tool={tool} />;
      }
      return <SingleImageTool tool={tool} />;
  }
}
