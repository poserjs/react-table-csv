"use client";
import React from "react";
import ReactTableCSV from "@/components/ReactTableCsv";
import { shortSampleCSV } from "./sample-data";

export default function Page() {
  return (
    <main className="p-6">
      <ReactTableCSV csvString={shortSampleCSV} />
    </main>
  );
}
