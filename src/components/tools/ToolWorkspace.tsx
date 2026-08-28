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
import { ExtraEditTools } from "./ExtraEditTools";
import { ImageStudio } from "./ImageStudio";
import { VideoStudio } from "./StudioTools";
import { WatermarkStudio } from "./WatermarkStudio";
import { PdfStudio } from "./PdfStudio";
import { OcrTool } from "./OcrTool";
import { CodeTool } from "./CodeTool";
import { TextTool } from "./TextTool";
import { ImageFxTool } from "./ImageFxTool";
import { ExifTool } from "./ExifTool";

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
    case "watermark-studio":
      return <WatermarkStudio tool={tool} />;
    case "extra-edit":
      return <ExtraEditTools tool={tool} />;
    case "video-studio":
      return <VideoStudio tool={tool} />;
    case "pdf-studio":
      return <PdfStudio tool={tool} />;
    case "ocr":
      return <OcrTool tool={tool} />;
    case "codes":
      return <CodeTool tool={tool} />;
    case "text":
      return <TextTool tool={tool} />;
    case "image-fx":
      return <ImageFxTool tool={tool} />;
    case "exif":
      return <ExifTool tool={tool} />;
    default:
      if (tool.slug === "rotate-image" || tool.slug === "flip-image" || tool.slug === "black-and-white") {
        return <ImageStudio tool={tool} />;
      }
      return <SingleImageTool tool={tool} />;
  }
}
