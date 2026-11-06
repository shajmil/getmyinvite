import { DurableObject } from "cloudflare:workers";

// Free Durable Objects allow the CPU time needed for Next.js and existing password hashes.
export class AppServer extends DurableObject {
  async fetch(request) {
    const { default: application } = await import("./.open-next/worker.js");
    return application.fetch(request, this.env, {
      waitUntil: (promise) => this.ctx.waitUntil(promise),
    });
  }
}

export default {
  fetch(request, environment) {
    return environment.APP_SERVER.getByName("primary").fetch(request);
  },
};
