import assert from "node:assert/strict";
import { test } from "node:test";
import { loadLib } from "./support/load-ts.mjs";

const SEGMENT = "2ec79559-e5f2-4a84-887b-5cee315656a3";
const TOPIC = "418f8071-0c80-4e3f-a076-b21ccfd40318";

function resendWith(existing, { segments = [], topics = [], topicError = null } = {}) {
  const calls = [];
  class Resend {
    contacts = {
      get: async (input) => {
        calls.push(["get", input]);
        return existing
          ? { data: existing, error: null }
          : { data: null, error: { name: "not_found" } };
      },
      create: async (input) => { calls.push(["create", input]); return { data: { id: "new-contact" }, error: null }; },
      update: async (input) => { calls.push(["update", input]); return { data: {}, error: null }; },
      segments: {
        list: async () => ({ data: { data: segments.map((id) => ({ id })) }, error: null }),
        add: async (input) => { calls.push(["segment-add", input]); return { data: {}, error: null }; },
      },
      topics: {
        list: async () => ({ data: { data: topics }, error: null }),
        update: async (input) => { calls.push(["topic-update", input]); return { data: {}, error: topicError }; },
      },
    };
  }
  const lib = loadLib("newsletter", {
    mocks: { resend: { Resend } },
    env: { RESEND_API_KEY: "test-key" },
  });
  return { lib, calls };
}

const names = (calls) => calls.map(([name]) => name);

test("confirming a brand-new address subscribes it to the newsletter", async () => {
  const { lib, calls } = resendWith(null);
  await lib.joinNewsletter("reader@example.com");
  const create = calls.find(([name]) => name === "create")[1];
  assert.equal(create.email, "reader@example.com");
  assert.equal(create.unsubscribed, false);
  assert.equal(create.segments[0].id, SEGMENT);
  assert.equal(create.topics[0].id, TOPIC);
  assert.equal(create.topics[0].subscription, "opt_in");
});

test("confirming an unconfirmed contact opts it in and adds it to the segment", async () => {
  const { lib, calls } = resendWith({ id: "c1", unsubscribed: false, properties: {} }, {
    topics: [{ id: TOPIC, subscription: "opt_out" }],
  });
  await lib.joinNewsletter("reader@example.com");
  assert.deepEqual(names(calls), ["get", "topic-update", "segment-add"]);
  assert.equal(calls[1][1].topics[0].subscription, "opt_in");
  assert.equal(calls[2][1].segmentId, SEGMENT);
  assert.equal(calls[2][1].contactId, "c1");
});

test("confirming restores a contact that was globally unsubscribed", async () => {
  const { lib, calls } = resendWith({ id: "c1", unsubscribed: true, properties: {} }, { segments: [SEGMENT] });
  await lib.joinNewsletter("reader@example.com");
  assert.ok(names(calls).includes("update"));
  assert.equal(calls.find(([name]) => name === "update")[1].unsubscribed, false);
  assert.equal(names(calls).includes("segment-add"), false);
});

test("confirming twice changes nothing the second time", async () => {
  const { lib, calls } = resendWith({ id: "c1", unsubscribed: false, properties: {} }, {
    segments: [SEGMENT],
    topics: [{ id: TOPIC, subscription: "opt_in" }],
  });
  await lib.joinNewsletter("reader@example.com");
  assert.deepEqual(names(calls), ["get"]);
});

test("a failed subscription write is reported so the link can be retried", async () => {
  const { lib } = resendWith({ id: "c1", unsubscribed: false, properties: {} }, {
    topics: [{ id: TOPIC, subscription: "opt_out" }],
    topicError: { message: "provider down" },
  });
  await assert.rejects(lib.joinNewsletter("reader@example.com"), /Could not subscribe/);
});
