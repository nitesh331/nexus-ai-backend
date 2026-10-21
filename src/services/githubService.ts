// GitHub API Client Service for Web Design Workspace
// No database needed: all files, branches, and commits are managed directly via GitHub REST API.

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  total_private_repos?: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  updated_at: string;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  size?: number;
}

export interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  html_url: string;
  download_url: string | null;
}

export interface GitHubFileContent extends GitHubContentItem {
  content?: string;
  encoding?: string;
}

export interface CommitResult {
  commit: {
    sha: string;
    html_url: string;
    message: string;
  };
  content: {
    name: string;
    path: string;
    sha: string;
  };
}

export function decodeBase64Utf8(base64Str: string): string {
  try {
    const clean = base64Str.replace(/\s/g, '');
    const binary = atob(clean);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (err) {
    try {
      return atob(base64Str.replace(/\s/g, ''));
    } catch {
      return base64Str;
    }
  }
}

export function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const GITHUB_API_BASE = 'https://api.github.com';

function getHeaders(token: string) {
  return {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `Bearer ${token.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

export async function verifyGitHubToken(token: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: getHeaders(token)
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Invalid GitHub token. Please check your token permissions.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub error: HTTP ${res.status}`);
  }
  return res.json();
}

export async function getUserRepos(token: string): Promise<GitHubRepo[]> {
  const res = await fetch(`${GITHUB_API_BASE}/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator`, {
    headers: getHeaders(token)
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch repositories (${res.status})`);
  }
  return res.json();
}

export async function getRepoBranches(token: string, owner: string, repo: string): Promise<string[]> {
  const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=50`, {
    headers: getHeaders(token)
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch branches (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data.map((b: any) => b.name) : ['main'];
}

export async function getRepoContents(
  token: string, 
  owner: string, 
  repo: string, 
  path: string = '', 
  branch?: string
): Promise<GitHubContentItem[] | GitHubFileContent> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${cleanPath}`);
  if (branch) {
    url.searchParams.set('ref', branch);
  }

  const res = await fetch(url.toString(), {
    headers: getHeaders(token)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to read ${path || 'root'} (${res.status})`);
  }
  return res.json();
}

export async function saveFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
): Promise<CommitResult> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const body: Record<string, any> = {
    message: message.trim() || `Update ${cleanPath} via Jaalix`,
    content: encodeBase64Utf8(content),
    branch
  };
  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${cleanPath}`, {
    method: 'PUT',
    headers: {
      ...getHeaders(token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 409) {
      throw new Error('Conflict: The file has been modified on GitHub since you opened it. Please refresh and try again.');
    }
    throw new Error(err.message || `Failed to commit to GitHub (${res.status})`);
  }

  return res.json();
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  draft?: boolean;
  html_url: string;
  created_at: string;
  updated_at: string;
  merged_at?: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  body: string | null;
  labels?: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
  comments?: number;
}

export async function getRepoPullRequests(
  token: string, 
  owner: string, 
  repo: string, 
  state: 'open' | 'closed' | 'all' = 'all'
): Promise<GitHubPullRequest[]> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=${state}&per_page=30`;
  const res = await fetch(url, {
    headers: getHeaders(token)
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch pull requests (${res.status})`);
  }
  return res.json();
}
