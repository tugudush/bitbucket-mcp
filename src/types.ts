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
  user: BitbucketUser;
  created_on: string;
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
}

export interface BitbucketActivity {
  action?: string;
  user: BitbucketUser;
  created_on: string;
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
