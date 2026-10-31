import assert from "node:assert/strict";
import test from "node:test";
import {
  getCategoryPath,
  getDescendantCategoryIds,
  getUniqueCategoryIds,
  isSafeModelSegment,
  productPath,
} from "../lib/public-site.ts";

const categories = [
  { id: "home", slug: "home-furniture", parent_id: null, status: "active" },
  { id: "living", slug: "living-area", parent_id: "home", status: "active" },
  { id: "bed", slug: "king-size-bed", parent_id: "living", status: "active" },
  { id: "office", slug: "office-furniture", parent_id: null, status: "active" },
  { id: "chair", slug: "executive-chair", parent_id: "office", status: "active" },
  { id: "workstation", slug: "workstation", parent_id: "office", status: "active" },
];

test("builds full category paths from active ancestors", () => {
  assert.deepEqual(getCategoryPath("office", categories), ["office-furniture"]);
  assert.deepEqual(getCategoryPath("chair", categories), ["office-furniture", "executive-chair"]);
  assert.deepEqual(getCategoryPath("bed", categories), ["home-furniture", "living-area", "king-size-bed"]);
});

test("rejects broken, inactive, and cyclic category paths while supporting future depth", () => {
  assert.deepEqual(getCategoryPath("missing-parent", [
    { id: "orphan", slug: "orphan", parent_id: "missing-parent", status: "active" },
  ]), []);
  assert.deepEqual(getCategoryPath("inactive-child", [
    { id: "parent", slug: "parent", parent_id: null, status: "inactive" },
    { id: "inactive-child", slug: "child", parent_id: "parent", status: "active" },
  ]), []);
  assert.deepEqual(getCategoryPath("a", [
    { id: "a", slug: "a", parent_id: "b", status: "active" },
    { id: "b", slug: "b", parent_id: "a", status: "active" },
  ]), []);
  assert.deepEqual(getCategoryPath("four", [
    { id: "one", slug: "one", parent_id: null, status: "active" },
    { id: "two", slug: "two", parent_id: "one", status: "active" },
    { id: "three", slug: "three", parent_id: "two", status: "active" },
    { id: "four", slug: "four", parent_id: "three", status: "active" },
  ]), ["one", "two", "three", "four"]);
});

test("detects unique category routes and excludes ambiguous ancestor paths", () => {
  assert.deepEqual([...getUniqueCategoryIds(categories)].sort(), categories.map((item) => item.id).sort());
  const duplicatePaths = [
    { id: "office-a", slug: "office-furniture", parent_id: null, status: "active" },
    { id: "office-b", slug: "office-furniture", parent_id: null, status: "active" },
    { id: "chair", slug: "executive-chair", parent_id: "office-a", status: "active" },
  ];
  assert.deepEqual([...getUniqueCategoryIds(duplicatePaths)], []);
});

test("returns descendants without looping on malformed relationships", () => {
  assert.deepEqual(getDescendantCategoryIds("home", categories), ["home", "living", "bed"]);
  assert.deepEqual(getDescendantCategoryIds("missing", categories), []);
  assert.deepEqual(getDescendantCategoryIds("a", [
    { id: "a", slug: "a", parent_id: "b", status: "active" },
    { id: "b", slug: "b", parent_id: "a", status: "active" },
  ]).sort(), ["a", "b"]);
});

test("validates model segments and builds canonical product URLs", () => {
  assert.equal(isSafeModelSegment("AF-9K"), true);
  assert.equal(isSafeModelSegment("AF_KB.001"), true);
  assert.equal(isSafeModelSegment("AF/9K"), false);
  assert.equal(isSafeModelSegment("../admin"), false);
  assert.equal(productPath(["office-furniture", "executive-chair"], "AF-9K"), "/furniture/office-furniture/executive-chair/AF-9K");
});
