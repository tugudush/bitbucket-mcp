/**
 * TypeScript interfaces for Bitbucket API responses
 */

export interface BitbucketUser {
  display_name: string;
  username: string;
  account_id: string;
  type: string;
  website?: string;
  location?: string;
  created_on: string;
}

export interface BitbucketRepository {
  full_name: string;
  name: string;
  description?: string;
  language?: string;
  size?: number;
  created_on: string;
  updated_on: string;
  is_private: boolean;
  parent?: BitbucketRepository;
  forks_count?: number;
  watchers_count?: number;
  website?: string;
  mainbranch?: { name: string };
  links?: {
    clone?: Array<{ name: string; href: string }>;
  };
}

export interface BitbucketBranch {
  name: string;
}

export interface BitbucketPullRequest {
  id: number;
  title: string;
  state: string;
  author: BitbucketUser;
  created_on: string;
  updated_on: string;
  description?: string;
  source: { branch: BitbucketBranch };
  destination: { branch: BitbucketBranch };
  reviewers?: BitbucketUser[];
}

export interface BitbucketComment {
  id: number;
  user: BitbucketUser;
  created_on: string;
  updated_on?: string;
  content?: {
    raw?: string;
    markup?: string;
  };
  inline?: {
    path: string;
    to?: number;
    from?: number;
  };
  parent?: {
    id: number;
  };
  deleted?: boolean;
}

export interface BitbucketActivity {
  action?: string;
  user?: BitbucketUser; // Can be undefined for system activities
  created_on?: string;
  update?: {
    date: string;
    author: BitbucketUser;
    state?: string;
    title?: string;
    reviewers?: BitbucketUser[];
  };
  comment?: BitbucketComment;
  approval?: {
    state: string;
  };
}

export interface BitbucketSrcItem {
  type: string;
  path: string;
  size?: number;
}

export interface BitbucketWorkspace {
  slug: string;
  name: string;
  type: string;
  uuid?: string;
  created_on?: string;
}

// Code search interfaces
export interface CodeSearchResult {
  type: string;
  content_match_count: number;
  content_matches: ContentMatch[];
  path_matches: PathMatch[];
  file: {
    path: string;
    type: string;
    links: {
      self: {
        href: string;
      };
    };
  };
}

export interface ContentMatch {
  lines: Array<{
    line: number;
    segments: Array<{
      text: string;
      match: boolean;
    }>;
  }>;
}

export interface PathMatch {
  text: string;
  match: boolean;
}

export interface CodeSearchResponse {
  size: number;
  page: number;
  pagelen: number;
  query_substituted: boolean;
  values: CodeSearchResult[];
}

export interface BitbucketIssue {
  id: number;
  title: string;
  state: string;
  kind: string;
  priority: string;
  reporter: BitbucketUser;
  assignee?: BitbucketUser;
  created_on: string;
  updated_on: string;
  content?: {
    raw?: string;
  };
}

export interface BitbucketCommit {
  hash: string;
  message: string;
  date: string;
  author: {
    user?: BitbucketUser;
    raw: string;
  };
}

export interface BitbucketBranchWithTarget {
  name: string;
  target: {
    hash: string;
    date: string;
  };
}

export interface BitbucketApiResponse<T> {
  values: T[];
  page?: number;
  size: number;
  next?: string;
  previous?: string;
  pagelen?: number;
}

// Diffstat interfaces for /diffstat/{spec} endpoint
export interface DiffstatFile {
  path: string;
  escaped_path: string;
  type: string;
  links?: {
    self: { href: string };
  };
}

export interface DiffstatEntry {
  type: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  lines_removed: number;
  lines_added: number;
  old?: DiffstatFile;
  new?: DiffstatFile;
}

export interface DiffstatResponse {
  pagelen: number;
  values: DiffstatEntry[];
  page: number;
  size: number;
  next?: string;
  previous?: string;
}

// Detailed commit info (single commit endpoint)
export interface BitbucketCommitDetailed {
  hash: string;
  message: string;
  date: string;
  author: {
    user?: BitbucketUser;
    raw: string;
  };
  parents?: Array<{ hash: string }>;
  repository?: {
    full_name: string;
  };
  summary?: {
    raw?: string;
  };
}

// Commit status (CI/CD build status)
export interface BitbucketCommitStatus {
  type: string;
  state: 'SUCCESSFUL' | 'FAILED' | 'INPROGRESS' | 'STOPPED';
  name: string;
  key: string;
  description?: string;
  url?: string;
  created_on: string;
  updated_on?: string;
}

// Tag ref
export interface BitbucketTag {
  name: string;
  target: {
    hash: string;
    date: string;
    message?: string;
    author?: {
      user?: BitbucketUser;
      raw: string;
    };
  };
  message?: string;
}

// Branch detailed ref
export interface BitbucketBranchDetailed {
  name: string;
  target: {
    hash: string;
    date: string;
    message?: string;
    author?: {
      user?: BitbucketUser;
      raw: string;
    };
  };
  merge_strategies?: string[];
  default_merge_strategy?: string;
}

// Merge base result
export interface BitbucketMergeBase {
  hash: string;
  date?: string;
  message?: string;
  author?: {
    user?: BitbucketUser;
    raw: string;
  };
}

// File history entry
export interface BitbucketFileHistoryEntry {
  commit: BitbucketCommit;
  path: string;
  type: string;
  size?: number;
}

// Pipeline interfaces
export interface BitbucketPipeline {
  uuid: string;
  build_number: number;
  state: {
    name: string;
    result?: {
      name: string;
    };
    stage?: {
      name: string;
    };
  };
  target: {
    type: string;
    ref_name?: string;
    ref_type?: string;
    selector?: {
      type: string;
      pattern?: string;
    };
    commit?: {
      hash: string;
      message?: string;
    };
  };
  trigger?: {
    name: string;
    type: string;
  };
  creator?: BitbucketUser;
  created_on: string;
  completed_on?: string;
  duration_in_seconds?: number;
}

export interface BitbucketPipelineStep {
  uuid: string;
  name?: string;
  state: {
    name: string;
    result?: {
      name: string;
    };
  };
  script_commands?: Array<{
    name: string;
    command: string;
  }>;
  started_on?: string;
  completed_on?: string;
  duration_in_seconds?: number;
  image?: {
    name: string;
  };
}

// PR task
export interface BitbucketPRTask {
  id: number;
  state: 'UNRESOLVED' | 'RESOLVED';
  content: {
    raw: string;
  };
  creator: BitbucketUser;
  created_on: string;
  updated_on?: string;
  comment?: {
    id: number;
  };
}

// Items returned by the Bitbucket
// /repositories/{workspace}/{repo_slug}/src/{ref}/{path} endpoint
export interface BitbucketSrcListingResponse {
  values: BitbucketSrcItem[];
  page?: number;
  size?: number;
  pagelen?: number;
  next?: string;
  previous?: string;
}
