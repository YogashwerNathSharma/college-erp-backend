import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { enforceTenantIsolation, resolveTenant } from "./tenant.middleware";

function mockResponse() {
  const response: any = {};
  response.statusCode = 200;
  response.status = (code: number) => {
    response.statusCode = code;
    return response;
  };
  response.json = (body: unknown) => {
    response.body = body;
    return response;
  };
  return response;
}

describe("tenant isolation", () => {
  it("rejects requests without tenant context", () => {
    const req: any = { user: { userId: "u1", role: "ADMIN" }, body: {} };
    const res = mockResponse();
    let nextCalled = false;

    enforceTenantIsolation(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
  });

  it("rejects a mismatched body tenantId", () => {
    const req: any = {
      user: { userId: "u1", role: "ADMIN", tenantId: "tenant-a" },
      body: { tenantId: "tenant-b" },
      params: {},
      query: {},
    };
    const res = mockResponse();
    let nextCalled = false;

    enforceTenantIsolation(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
  });

  it("canonicalizes the body tenantId to the authenticated tenant", () => {
    const req: any = {
      user: { userId: "u1", role: "ADMIN", tenantId: "tenant-a" },
      body: {},
      params: {},
      query: {},
    };
    const res = mockResponse();
    let nextCalled = false;

    enforceTenantIsolation(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.body.tenantId, "tenant-a");
  });

  it("allows SUPER_ADMIN to operate without a tenant context", () => {
    const req: any = {
      user: { userId: "root", role: "SUPER_ADMIN" },
      body: {},
      params: {},
      query: {},
    };
    const res = mockResponse();
    let nextCalled = false;

    resolveTenant(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  });

  it("rejects mismatched tenantId in resolveTenant", () => {
    const req: any = {
      user: { userId: "u1", role: "ADMIN", tenantId: "tenant-a" },
      body: { tenantId: "tenant-b" },
      params: {},
      query: {},
    };
    const res = mockResponse();
    let nextCalled = false;

    resolveTenant(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
  });
});
