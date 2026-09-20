import assert from "node:assert/strict";
import test from "node:test";
import { safeCallbackUrl } from "../src/lib/safe-redirect.ts";

test("account callbacks stay within the app and avoid sign-in loops", () => {
  for (const path of ["https://example.com", "//example.com", "/\\example.com", "/login", "/", "/register?next=/", "/robots\r\nLocation: evil"]) {
    assert.equal(safeCallbackUrl(path), "/app/dashboard");
  }
  assert.equal(safeCallbackUrl("/field-lab?team=123"), "/field-lab?team=123");
  assert.equal(safeCallbackUrl(undefined, "/onboarding"), "/onboarding");
});
