import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { displayName } from "../../../src/lib/personName.ts";
import { displayName as previewName } from "./share-preview.ts";

Deno.test("sophie becomes Sophie", () => assertEquals(displayName("sophie"), "Sophie"));
Deno.test("hyphen and apostrophe words", () => assertEquals(displayName("mary-ann o'neil"), "Mary-Ann O'Neil"));
Deno.test("McDonald stays as typed", () => assertEquals(displayName("McDonald"), "McDonald"));
Deno.test("empty stays empty", () => assertEquals(displayName(""), ""));
Deno.test("share preview uses the same rule", () => assertEquals(previewName("laura b."), "Laura B."));
