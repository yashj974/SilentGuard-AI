export interface ChatMessage {
  id: string;
  sender: 'user' | 'sentinel';
  text: string;
  timestamp: string;
  actionButton?: {
    label: string;
    url: string;
    isExternal?: boolean;
  };
  quickReplies?: string[];
}

export const SUGGESTED_QUESTIONS = [
  'What is silent security debt?',
  'How does risk scoring work?',
  'What makes SilentGuard different?',
  'How do I explore the dashboard?',
];

export const INITIAL_SENTINEL_MESSAGE: ChatMessage = {
  id: 'msg-welcome',
  sender: 'sentinel',
  text: "Hello! I'm Sentinel, your SilentGuard AI guide. I can help you understand silent security debt, explain our composite risk scoring, or navigate the developer dashboard.",
  timestamp: 'Just now',
  quickReplies: SUGGESTED_QUESTIONS,
};

export function getSentinelResponse(userQuery: string): {
  text: string;
  actionButton?: { label: string; url: string; isExternal?: boolean };
  quickReplies?: string[];
} {
  const normalized = userQuery.toLowerCase().trim();

  // 1. Silent security debt
  if (
    normalized.includes('what is silent') ||
    normalized.includes('security debt') ||
    (normalized.includes('silent') && normalized.includes('debt'))
  ) {
    return {
      text: "Silent security debt refers to structural and architectural weaknesses introduced by AI code generators (like Copilot or Cursor) that traditional CVE scanners miss. Examples include hallucinated API parameters, unvalidated trust boundary jumps, phantom exception swallowing, and unthrottled async loops.",
      quickReplies: ['How does risk scoring work?', 'What makes SilentGuard different?'],
    };
  }

  // 2. Risk scoring
  if (
    normalized.includes('how does risk scoring work') ||
    normalized.includes('risk score') ||
    normalized.includes('scoring') ||
    normalized.includes('calculate') ||
    normalized.includes('weights')
  ) {
    return {
      text: "Our Silent Debt Score is an explainable composite metric (0–100, graded A through F) calculated across 4 calibrated pillars:\n\n• Security Risk (35%): Trust boundary escalations & SSRF\n• Change Fragility (25%): Blast radius & coupling load\n• Reliability (25%): API schema drift & type divergences\n• Maintainability (15%): Exception swallowing & complexity\n\nA score of 80+ represents a Passed Quality Gate.",
      quickReplies: ['What is silent security debt?', 'How do I explore the dashboard?'],
      actionButton: {
        label: 'View Scoring in Settings',
        url: '/settings',
      },
    };
  }

  // 3. What makes SilentGuard different
  if (
    normalized.includes('different') ||
    normalized.includes('what makes') ||
    normalized.includes('sonar') ||
    normalized.includes('snyk') ||
    normalized.includes('compare')
  ) {
    return {
      text: "Traditional scanners check for known vulnerability signatures (CVEs). SilentGuard AI specializes in AI-synthesized code risk through four proprietary capabilities:\n\n1. Silent Debt Fingerprints: Catches LLM generation anti-patterns\n2. Change Fragility Index: Projects blast radius before PR merge\n3. Silent Debt Budget: Sprint-level debt velocity tracking\n4. Verified Fix Workflow: Tests automated AST patches in an isolated sandbox",
      quickReplies: ['What is silent security debt?', 'How do I explore the dashboard?'],
      actionButton: {
        label: 'Launch Workspace',
        url: '/workspace',
      },
    };
  }

  // 4. Explore the dashboard / Workspace
  if (
    normalized.includes('dashboard') ||
    normalized.includes('workspace') ||
    normalized.includes('explore') ||
    normalized.includes('how do i') ||
    normalized.includes('tour')
  ) {
    return {
      text: "The SilentGuard Workspace provides an enterprise developer console featuring the live Silent Debt Score gauge, 4 pillar risk indicators, module-level fragility tables, recent Git commit scans, and our Remediation Lab with verified fixes.",
      actionButton: {
        label: 'Open Workspace Dashboard',
        url: '/workspace',
      },
      quickReplies: ['What is silent security debt?', 'How does risk scoring work?'],
    };
  }

  // 5. Change Fragility
  if (
    normalized.includes('fragility') ||
    normalized.includes('cfi') ||
    normalized.includes('blast radius')
  ) {
    return {
      text: "The Change Fragility Index (CFI) measures how brittle your codebase becomes when LLMs generate non-local edits. It models AST coupling, fan-out, and untested execution paths to calculate whether small edits have high regression probability.",
      quickReplies: ['What is silent security debt?', 'What makes SilentGuard different?'],
      actionButton: {
        label: 'Inspect Change Impact',
        url: '/change-impact',
      },
    };
  }

  // 6. Remediation / Verified fix
  if (
    normalized.includes('fix') ||
    normalized.includes('remediat') ||
    normalized.includes('patch')
  ) {
    return {
      text: "Our Verified Fix workflow doesn't just suggest code comments. It synthesizes minimal AST diffs and verifies them against the existing unit test suite in an isolated security sandbox to ensure zero regressions before creating a PR.",
      quickReplies: ['What makes SilentGuard different?', 'How do I explore the dashboard?'],
      actionButton: {
        label: 'Explore Remediation Lab',
        url: '/remediation-lab',
      },
    };
  }

  // 7. Supported languages / stacks
  if (
    normalized.includes('language') ||
    normalized.includes('python') ||
    normalized.includes('typescript') ||
    normalized.includes('javascript') ||
    normalized.includes('stack')
  ) {
    return {
      text: "SilentGuard currently supports Python (FastAPI, Flask, Django) and TypeScript / JavaScript (Node.js, React). Go and Java AST parsers are actively in development.",
      quickReplies: ['What is silent security debt?', 'How does risk scoring work?'],
    };
  }

  // 8. Authentication / Start Free
  if (
    normalized.includes('login') ||
    normalized.includes('sign in') ||
    normalized.includes('signup') ||
    normalized.includes('sign up') ||
    normalized.includes('register') ||
    normalized.includes('start free') ||
    normalized.includes('account')
  ) {
    return {
      text: "You can create an account or sign in to SilentGuard AI from our authentication portal. In Phase 1, you can also explore the preloaded demonstration workspace directly without creating an account.",
      actionButton: {
        label: 'Go to Sign In',
        url: '/login',
      },
      quickReplies: ['How do I explore the dashboard?', 'What is silent security debt?'],
    };
  }

  // 9. CLI / Scan
  if (
    normalized.includes('cli') ||
    normalized.includes('how to scan') ||
    normalized.includes('install') ||
    normalized.includes('github action')
  ) {
    return {
      text: "You can run SilentGuard locally via our CLI tool (`curl -sSL https://get.silentguard.ai | bash`) or integrate our pre-built GitHub Action directly into your PR checks to block commits exceeding your Silent Debt Budget.",
      quickReplies: ['How does risk scoring work?', 'How do I explore the dashboard?'],
    };
  }

  // Fallback response - transparent about Phase 1 built-in knowledge base
  return {
    text: "I am Sentinel, operating in Phase 1 with a curated local knowledge base. I don't have access to an active external LLM connection yet, but I can answer questions about silent security debt, risk scoring, architectural fragility, and platform navigation.",
    quickReplies: SUGGESTED_QUESTIONS,
    actionButton: {
      label: 'Explore Workspace',
      url: '/workspace',
    },
  };
}
