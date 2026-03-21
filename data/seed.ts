import { randomUUID } from "node:crypto";

import { Store } from "@/lib/types";

export function buildSeedStore(): Store {
  const now = "2026-03-20T09:00:00.000Z";
  const automationSecret = `mto_${randomUUID().replaceAll("-", "")}`;

  return {
    organization: {
      id: "org_mathville",
      name: "Mathville",
      owner: "Brandon Lines",
      industry: "EdTech SaaS",
      framework: "SOC 2",
      auditWindow: "Q2 2026",
      workspaceMode: "Single-tenant internal compliance workspace"
    },
    controls: [
      {
        id: "control_access",
        code: "CC6.1",
        title: "Logical access is restricted to approved users",
        description: "Access to company systems is granted through approved provisioning, strong authentication, and periodic review.",
        family: "Access Control",
        owner: "IT & Security",
        cadence: "Quarterly",
        evidenceIds: ["evidence_access_review"],
        policyIds: ["policy_access"],
        testIds: ["check_google_mfa", "check_access_review_evidence"]
      },
      {
        id: "control_change",
        code: "CC8.1",
        title: "Production changes follow a controlled release process",
        description: "Code changes require peer review and branch protections before merging to production.",
        family: "Change Management",
        owner: "Engineering",
        cadence: "Continuous",
        evidenceIds: ["evidence_release_notes"],
        policyIds: ["policy_change"],
        testIds: ["check_github_branch_protection"]
      },
      {
        id: "control_logging",
        code: "CC7.2",
        title: "System activity is logged and monitored",
        description: "Infrastructure audit logging is enabled and reviewed to support investigations and monitoring.",
        family: "Monitoring",
        owner: "Platform",
        cadence: "Continuous",
        evidenceIds: ["evidence_cloudtrail_snapshot"],
        policyIds: ["policy_logging"],
        testIds: ["check_aws_audit_logging"]
      },
      {
        id: "control_incident",
        code: "CC7.4",
        title: "Incidents are identified, escalated, and resolved",
        description: "An incident response plan exists, is reviewed on schedule, and is used during operational events.",
        family: "Incident Response",
        owner: "Security",
        cadence: "Annual",
        evidenceIds: ["evidence_ir_tabletop"],
        policyIds: ["policy_incident"],
        testIds: ["check_incident_policy_review"]
      },
      {
        id: "control_training",
        code: "CC2.2",
        title: "Personnel complete security awareness training",
        description: "Team members receive onboarding and recurring security awareness training with completion evidence retained.",
        family: "People",
        owner: "People Ops",
        cadence: "Annual",
        evidenceIds: ["evidence_training"],
        policyIds: ["policy_security"],
        testIds: ["check_training_evidence"]
      },
      {
        id: "control_vendor",
        code: "CC9.2",
        title: "Vendors are evaluated before handling company data",
        description: "Third parties are tracked, reviewed, and approved before they receive access to sensitive systems or data.",
        family: "Vendor Management",
        owner: "Operations",
        cadence: "Annual",
        evidenceIds: ["evidence_vendor_review"],
        policyIds: ["policy_vendor"],
        testIds: ["check_vendor_review_evidence"]
      }
    ],
    policies: [
      {
        id: "policy_access",
        title: "Access Control Policy",
        owner: "IT & Security",
        version: "v2.1",
        summary: "Defines provisioning, deprovisioning, least privilege, and MFA requirements.",
        lastReviewed: "2026-02-12",
        nextReviewDue: "2027-02-12"
      },
      {
        id: "policy_change",
        title: "Change Management Policy",
        owner: "Engineering",
        version: "v1.8",
        summary: "Defines pull request approvals, release expectations, rollback planning, and emergency changes.",
        lastReviewed: "2026-01-10",
        nextReviewDue: "2027-01-10"
      },
      {
        id: "policy_logging",
        title: "Logging and Monitoring Policy",
        owner: "Platform",
        version: "v1.4",
        summary: "Defines system logging coverage, alerting, retention expectations, and operational review responsibilities.",
        lastReviewed: "2025-11-15",
        nextReviewDue: "2026-11-15"
      },
      {
        id: "policy_incident",
        title: "Incident Response Policy",
        owner: "Security",
        version: "v1.5",
        summary: "Defines incident classification, communications, roles, and tabletop requirements.",
        lastReviewed: "2025-01-05",
        nextReviewDue: "2026-01-05"
      },
      {
        id: "policy_security",
        title: "Security Awareness Policy",
        owner: "People Ops",
        version: "v1.2",
        summary: "Defines onboarding and recurring security training expectations for personnel.",
        lastReviewed: "2025-09-02",
        nextReviewDue: "2026-09-02"
      },
      {
        id: "policy_vendor",
        title: "Vendor Security Review Policy",
        owner: "Operations",
        version: "v1.0",
        summary: "Defines minimum due diligence, approvals, and review checkpoints for vendors.",
        lastReviewed: "2025-08-18",
        nextReviewDue: "2026-08-18"
      }
    ],
    evidence: [
      {
        id: "evidence_access_review",
        title: "Quarterly Google Workspace access review",
        description: "Reviewed active users, admins, and terminated accounts.",
        owner: "IT & Security",
        kind: "snapshot",
        source: "generated",
        controlId: "control_access",
        policyId: "policy_access",
        uploadedAt: "2026-02-28T14:00:00.000Z"
      },
      {
        id: "evidence_release_notes",
        title: "March production release notes",
        description: "Release notes linked to approved pull requests and deployment evidence.",
        owner: "Engineering",
        kind: "snapshot",
        source: "generated",
        controlId: "control_change",
        policyId: "policy_change",
        uploadedAt: "2026-03-14T17:30:00.000Z"
      },
      {
        id: "evidence_cloudtrail_snapshot",
        title: "AWS logging coverage snapshot",
        description: "CloudTrail and AWS Config coverage reviewed for core production accounts.",
        owner: "Platform",
        kind: "snapshot",
        source: "integration",
        controlId: "control_logging",
        policyId: "policy_logging",
        uploadedAt: "2026-03-12T11:00:00.000Z"
      },
      {
        id: "evidence_ir_tabletop",
        title: "Incident response tabletop results",
        description: "Tabletop exercise outcomes, action items, and communications plan review.",
        owner: "Security",
        kind: "snapshot",
        source: "manual",
        controlId: "control_incident",
        policyId: "policy_incident",
        uploadedAt: "2025-10-08T13:20:00.000Z"
      },
      {
        id: "evidence_training",
        title: "Annual security awareness completion report",
        description: "Training completion export for all active teammates.",
        owner: "People Ops",
        kind: "snapshot",
        source: "manual",
        controlId: "control_training",
        policyId: "policy_security",
        uploadedAt: "2025-05-16T09:30:00.000Z"
      },
      {
        id: "evidence_vendor_review",
        title: "Critical vendor review log",
        description: "Review outcomes for cloud hosting, payroll, and analytics vendors.",
        owner: "Operations",
        kind: "snapshot",
        source: "manual",
        controlId: "control_vendor",
        policyId: "policy_vendor",
        uploadedAt: "2025-12-22T15:45:00.000Z"
      }
    ],
    tasks: [
      {
        id: "task_rotate_ir_policy",
        title: "Refresh incident response policy review",
        description: "Policy review is overdue and should be reapproved before the next audit sample.",
        owner: "Security",
        dueDate: "2026-03-28",
        status: "open",
        priority: "high",
        sourceType: "manual",
        createdAt: now
      },
      {
        id: "task_training_refresh",
        title: "Upload updated awareness training completion evidence",
        description: "The latest completion report is approaching staleness for the 2026 audit period.",
        owner: "People Ops",
        dueDate: "2026-04-05",
        status: "in_progress",
        priority: "medium",
        sourceType: "manual",
        createdAt: now
      }
    ],
    integrations: [
      {
        id: "integration_github",
        name: "GitHub",
        category: "Engineering",
        description: "Tracks branch protections and approval expectations for production repositories.",
        connected: true,
        owner: "Engineering",
        lastSync: "2026-03-20T08:45:00.000Z",
        settings: {
          branchProtectionEnabled: true,
          requiresApprovals: true,
          repositoryCount: "6"
        }
      },
      {
        id: "integration_aws",
        name: "AWS",
        category: "Infrastructure",
        description: "Tracks audit logging controls for production cloud accounts.",
        connected: true,
        owner: "Platform",
        lastSync: "2026-03-20T08:42:00.000Z",
        settings: {
          cloudTrailEnabled: true,
          awsConfigEnabled: false,
          productionAccounts: "2"
        }
      },
      {
        id: "integration_google",
        name: "Google Workspace",
        category: "Identity",
        description: "Tracks MFA, admin coverage, and directory review evidence.",
        connected: true,
        owner: "IT & Security",
        lastSync: "2026-03-20T08:35:00.000Z",
        settings: {
          mfaRequired: false,
          ssoEnabled: true,
          userCount: "19"
        }
      }
    ],
    checkRuns: [],
    automation: {
      enabled: true,
      secret: automationSecret,
      lastEventAt: null,
      events: [
        {
          id: "automation_seeded",
          type: "evidence.create",
          status: "accepted",
          source: "bootstrap",
          summary: "Automation endpoint seeded and ready to receive events.",
          receivedAt: now
        }
      ]
    }
  };
}
