export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateSnippetDto {
  title: string;
  description?: string;
  code: string;
  language: string;
  tags: string[];
}

export interface UpdateSnippetDto extends Partial<CreateSnippetDto> {}

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}
