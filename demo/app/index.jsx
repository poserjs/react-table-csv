"use client";
import React from "react";
import ReactTableCSV from "@/components/ReactTableCsv";

const sampleCSV = `Name,Department,Position
John Smith,Engineering,Senior Developer
Sarah Johnson,Marketing,Manager`;

export default function Page() {
  return (
    <main className="p-6">
      <ReactTableCSV csvString={sampleCSV} />
    </main>
  );
}
