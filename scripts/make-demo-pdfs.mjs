/**
 * Generate the demo PDFs used in the MCP walkthrough (see DEMO.md).
 *
 *   node scripts/make-demo-pdfs.mjs
 *
 * Writes 2–3 PDFs full of specific, queryable facts into examples/demo-docs/.
 * The content is fictional ("Northwind") so nothing here is sensitive; the point
 * is to have concrete details a query can retrieve back through the graph.
 */
import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "examples", "demo-docs");
mkdirSync(OUT_DIR, { recursive: true });

/** Render a simple titled document with headings + paragraphs to a PDF file. */
function writePdf(filename, title, blocks) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: "A4" });
    const path = join(OUT_DIR, filename);
    const stream = createWriteStream(path);
    doc.pipe(stream);

    doc.font("Helvetica-Bold").fontSize(20).text(title);
    doc.moveDown(0.8);

    for (const block of blocks) {
      if (block.heading) {
        doc.moveDown(0.4);
        doc.font("Helvetica-Bold").fontSize(13).text(block.heading);
        doc.moveDown(0.2);
      }
      doc.font("Helvetica").fontSize(11).text(block.body, { align: "left", lineGap: 2 });
    }

    doc.end();
    stream.on("finish", () => resolve(path));
    stream.on("error", reject);
  });
}

const docs = [
  {
    filename: "northwind-architecture.pdf",
    title: "Northwind Platform — Architecture Overview",
    blocks: [
      {
        heading: "Services",
        body:
          "The Northwind platform is composed of five core services. The Orders Service accepts customer orders and is the system of record for order state. It calls the Inventory Service to reserve stock and the Payments Service to charge the customer. The Payments Service integrates with Stripe as the payment processor. The Notifications Service sends transactional email through SendGrid and SMS through Twilio.",
      },
      {
        heading: "Data stores",
        body:
          "The Orders Service stores order data in a PostgreSQL database named orders_db. The Inventory Service uses a separate PostgreSQL database named inventory_db. Both services publish domain events to an Apache Kafka cluster on the topic 'northwind.events'. The Notifications Service consumes those events to decide when to message customers.",
      },
      {
        heading: "Authentication",
        body:
          "All services authenticate requests using JWT access tokens issued by the Auth Service. Access tokens expire after 15 minutes; refresh tokens expire after 30 days. The Auth Service is backed by Redis for token revocation lists.",
      },
      {
        heading: "Deployment",
        body:
          "Northwind runs on Kubernetes in the AWS us-east-1 region. Each service is deployed as a separate Deployment with a minimum of 3 replicas. Container images are built by GitHub Actions and pushed to Amazon ECR. Production deploys require approval from a member of the Platform team.",
      },
    ],
  },
  {
    filename: "northwind-billing-runbook.pdf",
    title: "Northwind Billing — On-Call Runbook",
    blocks: [
      {
        heading: "Failed charges",
        body:
          "When a charge fails, the Payments Service emits a payment_failed event. The Dunning Worker retries the charge up to 3 times with exponential backoff (1 hour, 6 hours, 24 hours). After the third failed retry, the subscription is marked past_due and the Notifications Service emails the customer. If the account remains past_due for 7 days, it is automatically suspended.",
      },
      {
        heading: "Refunds",
        body:
          "Refunds are issued through the Payments Service admin API. Refunds above $500 require approval from a Finance team lead. All refunds are logged to the audit_log table in payments_db and reflected in Stripe within 24 hours.",
      },
      {
        heading: "Escalation",
        body:
          "The billing on-call rotation is owned by the Payments team. The primary on-call responds within 15 minutes during business hours and within 30 minutes off-hours. Page the on-call via PagerDuty service 'northwind-billing'. For Stripe outages, escalate to the Payments team lead, Dana Whitfield, and post an update in the #billing-incidents Slack channel.",
      },
      {
        heading: "Key metrics",
        body:
          "The billing dashboard tracks charge success rate (target: above 97%), average time to first retry, and past_due account count. An alert fires if the charge success rate drops below 95% over any 30-minute window.",
      },
    ],
  },
  {
    filename: "northwind-onboarding.pdf",
    title: "Northwind Engineering — New Hire Onboarding",
    blocks: [
      {
        heading: "Getting access",
        body:
          "New engineers request access through the IT portal. Standard access includes GitHub (the northwind-inc org), the AWS developer account, PagerDuty, and Slack. Production database access requires a separate request approved by your team lead and is granted for 90 days at a time.",
      },
      {
        heading: "Local setup",
        body:
          "Clone the northwind-inc/platform monorepo. Install Node.js 20 and Docker. Run 'make bootstrap' to start local Postgres, Redis, and Kafka via docker-compose. Copy .env.sample to .env and fill in your personal API keys. Run 'make test' to verify the setup.",
      },
      {
        heading: "Team structure",
        body:
          "Engineering has four teams. The Platform team owns infrastructure and CI/CD. The Payments team owns the Payments Service and billing. The Orders team owns the Orders and Inventory services. The Growth team owns the Notifications Service and customer-facing features. The VP of Engineering is Priya Nair.",
      },
      {
        heading: "First week",
        body:
          "In your first week you should complete the security training, ship one small change to production, and pair with a teammate on an on-call shadow. Your onboarding buddy is assigned on day one. Ask questions in the #eng-help Slack channel.",
      },
    ],
  },
];

const written = [];
for (const d of docs) {
  written.push(await writePdf(d.filename, d.title, d.blocks));
}
console.log("Wrote demo PDFs:");
for (const p of written) console.log("  " + p);
