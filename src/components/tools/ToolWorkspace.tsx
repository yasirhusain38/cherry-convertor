"use client";

import type { ToolDef } from "@/lib/tools";
import { BulkTool } from "./BulkTool";
import { ConvertTool } from "./ConvertTool";
import { CropTool } from "./CropTool";
import { DocumentCompressTool } from "./DocumentCompressTool";
import { BgTool, DpiTool, SignatureTool } from "./EditTools";
import { PdfTool } from "./PdfTool";
import { PhotoTool } from "./PhotoTool";
import { SingleImageTool } from "./SingleImageTool";

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
      return <BgTool />;
    case "signature":
      return <SignatureTool />;
    case "bulk-resize":
    case "bulk-compress":
      return <BulkTool mode={tool.mode} />;
    default:
      return <SingleImageTool tool={tool} />;
  }
}
