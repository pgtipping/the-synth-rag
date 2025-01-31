import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileAlt,
  FaFileCode,
  FaFileArchive,
  FaFile,
} from "react-icons/fa";

interface FileIconProps {
  fileName?: string;
  className?: string;
}

export const FileIcon = ({ fileName, className }: FileIconProps) => {
  const extension = (fileName || "").split(".").pop()?.toLowerCase() || "";

  const iconMap = {
    pdf: FaFilePdf,
    doc: FaFileWord,
    docx: FaFileWord,
    xls: FaFileExcel,
    xlsx: FaFileExcel,
    jpg: FaFileImage,
    jpeg: FaFileImage,
    png: FaFileImage,
    txt: FaFileAlt,
    csv: FaFileAlt,
    xml: FaFileCode,
    html: FaFileCode,
    js: FaFileCode,
    ts: FaFileCode,
    zip: FaFileArchive,
    rar: FaFileArchive,
  };

  const IconComponent = iconMap[extension as keyof typeof iconMap] || FaFile;

  return (
    <IconComponent
      className={className || "text-gray-400 dark:text-gray-500"}
    />
  );
};
