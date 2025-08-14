"use client";
import React from "react";
import { ReactTableCSV } from "../src";
import { longSampleCSV } from "./sample-data";

const sampleSettings = '{"version":"0.1","columnStyles":{"Department":{"splitBy":true,"type":"number"},"Position":{"groupBy":true},"Name":{"reducer":"cnt"},"Salary":{"reducer":"min-max","type":"number"},"Start Date":{"reducer":"min-max"},"Performance Rating":{"reducer":"min-max"}},"columnOrder":["Department","Position","Name","Salary","Start Date","Performance Rating"],"hiddenColumns":["Department"],"filters":{"Salary":">60000","Position":""},"dropdownFilters":{},"filterMode":{"Salary":"text"},"showFilterRow":false,"pinnedAnchor":null,"showRowNumbers":true}';

export default function Page() {
  return (
    <main className="p-1">
      <ReactTableCSV csvString={longSampleCSV} defaultSettings={sampleSettings} />
    </main>
  );
}
